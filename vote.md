# Votes

* CONTINUE: UI
* TODO OQ how to get new item position after vote
  * a) def vote(self, user: User) -> int
  * b) Item.position = 0 (in json only if include is true query position)
  * bauchgefühl sagt a, weil position kein property von Item
* TODO: switch List.Items rcollection if feature votes gets enabled/disabled

* How to make combine Object and Meta (e.g. for Activity)
```
class Blubbs(Object, CollectionSeq):
  def __init__(self, id, app, count):
    super().__init__(id, app)
    CollectionSeq.__init__(self, self, Collection.Meta(count, app), RedisList(app.r, id+'.foo'), app)

  def json(self, r, i, s):
    return {
      **super().json(r, i),
      **CollectionSeq.json(self, r, i)
    }
```

# Auto sorting

```
Items.create:
zadd(list.id 'items_by_votes', 0, item.id)

Update:
For lists:
zadd(list.id + ... , **{item.id: 0 for item in items})

def Item.vote:
def Item.unvote:
zadd(list.id..., len(item.votes), self.id)
# maybe call friend Methode of container

class Item:
votes = Collection(RedisSortedSet(self.id + '.votes'))
likes = Collection(RedisSortedSet(self.id + '.likes))
# alt
votes_ids = set()
@property def votes: omget(*votes_ids)

def vote(user):
zadd(..., 0, user.id)
# alt
if user.id not in self.votes_ids:
self.votes_ids.append(user.id)
oset(self.id, self)

A oder B? A wenn es eigenen Endpunkt geben soll, ansonsten B
```
