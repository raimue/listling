# Open Listling
# Copyright (C) 2018 Open Listling contributors
#
# This program is free software: you can redistribute it and/or modify it under the terms of the GNU
# Affero General Public License as published by the Free Software Foundation, either version 3 of
# the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
# even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License along with this program.
# If not, see <https://www.gnu.org/licenses/>.

"""Open Listling core."""

import micro
from micro import (Activity, Application, Editable, Object, Orderable, Trashable, Settings, Event)
from micro.jsonredis import (JSONRedis, JSONRedisSequence, RedisSortedSet, RedisSequence,
JSONRedisMapping, RedisList)
from micro.util import randstr, str_or_none

from micro import User
from time import time

import typing
from typing import Any, Dict, Tuple, Union, Optional, Callable

#from typing_extensions import Protocol
#class Jsonifiable(Protocol):
#    def json(self, restricted: bool = False, include: bool = False) -> Dict[str, Any]:
#        ...

# TODO move to micro
class Collection:
    """
    .. describe:: size

       Number of items in the collection (that are not trashed).
    """

    class Meta:
        def __init__(self, size: int, app: Application) -> None:
            self.size = size

        def json(self, restricted: bool = False, include: bool = False) -> Dict[str, Any]:
            return {**({} if restricted else {'__type__': 'Collection.Meta'}), 'size': self.size}

    def __init__(self, rcollection: RedisSequence, meta: Meta, key: Union[str, Object],
                 app: Application) -> None:
        # self.key, self.host = None, key if isinstance(key, Object) else key, None
        self.rcollection = rcollection
        self.meta = meta
        self.key = key
        self.app = app

    @property
    def size(self) -> int:
        return self.meta.size

    def update_meta(self) -> None:
        self.meta.size = len(self.rcollection)
        # self.app.r.oset(self.host.id if self.host else self.key, self.host or self)
        #if isinstance(self.key, Object):
        #    key, object = self.key.id, self.key # te: (str, Jsonifiable)
        #else:
        #    key, object = self.key, self.meta
        key, object = (self.key.id, self.key) if isinstance(self.key, Object) else (self.key, self.meta)
        #self.app.r.oset(*(self.key.id, self.key if isinstance(self.key, Object) else self.key, self))
        self.app.r.oset(key, object)

    def json(self, restricted: bool = False, include: bool = False,
             slice: slice = None) -> Dict[str, Any]:
        items = JSONRedisSequence[Object](self.rcollection)
        return {
            **self.meta.json(restricted),
            **({'items': item.json(True, True) for item in items[slice]} if slice else {})
        }

class CollectionSeq(Collection, JSONRedisSequence):
    def __init__(self, rcollection: RedisSequence, meta: Collection.Meta, key: Union[str, Object],
                 app: Application) -> None:
        super().__init__(rcollection, meta, key, app)
        JSONRedisSequence.__init__(self, rcollection)

class CollectionMap(Collection, JSONRedisMapping):
    def __init__(self, rcollection: RedisSequence, meta: Collection.Meta, key: Union[str, Object],
                 app: Application) -> None:
        super().__init__(rcollection, meta, key, app)
        JSONRedisMapping.__init__(self, rcollection)

_USE_CASES = {
    'simple': {'title': 'New list', 'features': []},
    'todo': {'title': 'New to-do list', 'features': ['check']},
    'shopping': {'title': 'New shopping list', 'features': []},
    'meeting-agenda': {'title': 'New meeting agenda', 'features': []},
    'poll': {'title': 'New poll', 'features': ['vote']}
}

_EXAMPLE_DATA = {
    'todo': (
        'Project tasks',
        'Things we need to do to complete our project.',
        [
            {'title': 'Do research', 'checked': True},
            {'title': 'Create draft'},
            {'title': 'Write report', 'text': 'Summary of the results'}
        ]
    ),
    'shopping': (
        'Kitchen shopping list',
        'When you go shopping next time, please bring the items from this list.',
        [
            {'title': 'Soy sauce'},
            {'title': 'Vegetables', 'text': 'Especially tomatoes'},
            {'title': 'Chocolate (vegan)'}
        ]
    ),
    'meeting-agenda': (
        'Working group agenda',
        'We meet on Monday and discuss important issues.',
        [
            {'title': 'Round of introductions'},
            {'title': 'Lunch poll', 'text': 'What will we have for lunch today?'},
            {'title': 'Next meeting', 'text': 'When and where will our next meeting be?'}
        ]
    )
}

class Listling(Application):
    """See :ref:`Listling`."""

    class Lists(CollectionMap):
        """See :ref:`Lists`."""

        def create(self, use_case=None, description=None, title=None, v=1):
            """See :http:post:`/api/lists`."""
            if v == 1:
                # create(title, description=None)
                title = title or use_case
                if title is None:
                    raise TypeError()
                lst = self.create('simple', v=2)
                lst.edit(title=title, description=description)
                return lst
            elif v == 2:
                # create(use_case='simple')
                use_case = use_case or 'simple'
            else:
                raise NotImplementedError()

            if use_case not in _USE_CASES:
                raise micro.ValueError('use_case_unknown')
            data = _USE_CASES[use_case]
            id = 'List:{}'.format(randstr())
            lst = List(
                id, self.app, authors=[self.app.user.id], title=data['title'], description=None,
                features=data['features'], items = Collection.Meta(0, self.app),
                activity=Activity('{}.activity'.format(id), self.app, subscriber_ids=[]))
            self.app.r.oset(lst.id, lst)
            self.app.r.rpush(self.rcollection.key, lst.id)
            self.update_meta()
            self.app.activity.publish(
                Event.create('create-list', None, {'lst': lst}, app=self.app))
            return lst

        def create_example(self, use_case):
            """See :http:post:`/api/lists/create-example`."""
            if use_case not in _EXAMPLE_DATA:
                raise micro.ValueError('use_case_unknown')
            data = _EXAMPLE_DATA[use_case]
            description = (
                '{}\n\nThis example was created just for you, so please feel free to play around.'
                .format(data[1]))

            lst = self.create(use_case, v=2)
            lst.edit(title=data[0], description=description)
            for item in data[2]:
                args = dict(item)
                checked = args.pop('checked', False)
                item = lst.items.create(**args)
                if checked:
                    item.check()
            return lst

    def __init__(self, redis_url: str = '', email: str = 'bot@localhost', smtp_url: str = '',
                 render_email_auth_message: Callable = None) -> None: # TODO more precise callable
        super().__init__(redis_url, email, smtp_url, render_email_auth_message)
        self.types.update({'List': List, 'Item': Item, 'Collection.Meta': Collection.Meta})

    @property
    def lists(self) -> Lists:
        return Listling.Lists(RedisList(self.r, 'lists.items'), self.r.oget('lists'), 'lists',
                              app=self)

    def do_update(self) -> None:
        version = self.r.get('version')
        if not version:
            #Listling.Lists('lists', RedisList(self.r, 'list.items'), 0, self).update()
            self.r.oset('lists', Collection.Meta(0, self))
            self.r.set('version', 4)
            return

        version = int(version)
        r = JSONRedis(self.r.r)
        r.caching = False

        # Deprecated since 0.3.0
        if version < 2:
            lists = r.omget(r.lrange('lists', 0, -1))
            for lst in lists:
                lst['features'] = []
                items = r.omget(r.lrange('{}.items'.format(lst['id']), 0, -1))
                for item in items:
                    item['checked'] = False
                r.omset({item['id']: item for item in items})
            r.omset({lst['id']: lst for lst in lists})
            r.set('version', 2)

        # Deprecated since 0.5.0
        if version < 3:
            lists = r.omget(r.lrange('lists', 0, -1))
            for lst in lists:
                lst['activity'] = (
                    Activity('{}.activity'.format(lst['id']), app=self, subscriber_ids=[]).json())
            r.omset({lst['id']: lst for lst in lists})
            r.set('version', 3)

        if version < 4:
            r.rename('lists', 'lists.items')
            r.oset('lists', Collection.Meta(0, self).json())
            lists = r.omget(r.lrange('lists.items', 0, -1))
            for lst in lists:
                key = '{}.items'.format(lst['id'])
                lst['items'] = Collection.Meta(r.llen(key), self).json()
                items = r.omget(r.lrange(key, 0, -1))
                for item in items:
                    item['votes'] = Collection.Meta(0, self).json()
                r.omset({item['id']: item for item in items})
            r.omset({lst['id']: lst for lst in lists})
            r.set('version', 4)

    def create_settings(self):
        # pylint: disable=unexpected-keyword-arg; decorated
        return Settings(
            id='Settings', app=self, authors=[], title='My Open Listling', icon=None,
            icon_small=None, icon_large=None, provider_name=None, provider_url=None,
            provider_description={}, feedback_url=None, staff=[], push_vapid_private_key=None,
            push_vapid_public_key=None, v=2)

class List(Object, Editable):
    """See :ref:`List`."""

    class Items(CollectionMap, Orderable):
        """See :ref:`Items`."""

        def create(self, title: str, text: str =None) -> 'Item':
            """See :http:post:`/api/lists/(id)/items`."""
            if not isinstance(self.key, List):
                raise TypeError()
            if str_or_none(title) is None:
                raise micro.ValueError('title_empty')
            item = Item(
                id='Item:{}'.format(randstr()), app=self.app, authors=[self.app.user.id],
                trashed=False, list_id=self.key.id, title=title, text=str_or_none(text),
                checked=False, votes = Collection.Meta(0, self.app))
            self.app.r.oset(item.id, item)
            self.app.r.rpush('{}.items'.format(self.key.id), item.id)
            self._update_item(item)
            self.update_meta()
            self.key.activity.publish(
                Event.create('list-create-item', self.key, {'item': item}, self.app))
            return item

        def _update_item(self, item: 'Item') -> None:
            if not isinstance(self.key, List):
                raise TypeError()
            self.app.r.zadd('{}.items_by_votes'.format(self.key.id), -item.votes.size, item.id)

    def __init__(self, id, app, authors, title, description, features, items, activity):
        super().__init__(id, app)
        Editable.__init__(self, authors, activity)
        self.title = title
        self.description = description
        self.features = features
        # TODO: must change if vote is enabled/disabled in features
        rcollection = (
            RedisSortedSet(self.app.r, '{}.items_by_votes'.format(self.id))
            if 'vote' in self.features else RedisList(self.app.r, '{}.items'.format(self.id)))
        self.items = List.Items(rcollection, items, self, app)
        self.activity = activity
        self.activity.host = self

    def do_edit(self, **attrs):
        if 'title' in attrs and str_or_none(attrs['title']) is None:
            raise micro.ValueError('title_empty')
        if 'features' in attrs and not set(attrs['features']) <= {'check'}:
            raise micro.ValueError('feature_unknown')
        if 'title' in attrs:
            self.title = attrs['title']
        if 'description' in attrs:
            self.description = str_or_none(attrs['description'])
        if 'features' in attrs:
            self.features = attrs['features']

    def json(self, restricted=False, include=False):
        return {
            **super().json(restricted, include),
            **Editable.json(self, restricted, include),
            'title': self.title,
            'description': self.description,
            'features': self.features,
            'items': self.items.meta.json(restricted),
            'activity': self.activity.json(restricted)
        }

class Item(Object, Editable, Trashable):
    """See :ref:`Item`."""

    def __init__(
            self, id: str, app: Application, authors: typing.List[str], trashed: bool, list_id: str,
            title: str, text: Optional[str], checked: bool, votes: Collection.Meta) -> None:
        super().__init__(id, app)
        Editable.__init__(self, authors, lambda: self.list.activity)
        Trashable.__init__(self, trashed, lambda: self.list.activity)
        self._list_id = list_id
        self.title = title
        self.text = text
        self.checked = checked
        self.votes = CollectionSeq(RedisSortedSet(app.r, '{}.votes'.format(id)), votes, self, app)

    @property
    def list(self):
        # pylint: disable=missing-docstring; already documented
        return self.app.lists[self._list_id]

    def check(self):
        """See :http:post:`/api/lists/(list-id)/items/(id)/check`."""
        _check_feature(self.app.user, 'check', self)
        self.checked = True
        self.app.r.oset(self.id, self)
        self.list.activity.publish(Event.create('item-check', self, app=self.app))

    def uncheck(self):
        """See :http:post:`/api/lists/(list-id)/items/(id)/uncheck`."""
        _check_feature(self.app.user, 'check', self)
        self.checked = False
        self.app.r.oset(self.id, self)
        self.list.activity.publish(Event.create('item-uncheck', self, app=self.app))

    def vote(self, user: User) -> None:
        _check_feature(user, 'vote', self)
        self.app.r.zadd(self.votes.rcollection.key, time(), user.id)
        self.votes.update_meta()
        self.list.items._update_item(self)

    def unvote(self, user: User) -> None:
        _check_feature(user, 'vote', self)
        self.app.r.zrem(self.votes.rcollection.key, user.id)
        self.votes.update_meta()
        self.list.items._update_item(self)

    def do_edit(self, **attrs):
        if 'title' in attrs and str_or_none(attrs['title']) is None:
            raise micro.ValueError('title_empty')
        if 'title' in attrs:
            self.title = attrs['title']
        if 'text' in attrs:
            self.text = str_or_none(attrs['text'])

    def json(self, restricted=False, include=False):
        return {
            **super().json(restricted, include),
            **Editable.json(self, restricted, include),
            **Trashable.json(self, restricted, include),
            'list_id': self._list_id,
            'title': self.title,
            'text': self.text,
            'checked': self.checked,
            'votes': self.votes.meta.json(restricted)
        }

def _check_feature(user, feature, item):
    if feature not in item.list.features:
        raise micro.ValueError('feature_disabled')
    if not user:
        raise PermissionError()
