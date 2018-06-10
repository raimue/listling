# Dashboard

micro branch: custom-user

* OQ list layout
  * grid not possible, because ul li nested (display contents subgrid not available)
  * a) table layout (dynamic spacing over multiple rows, less control)
  * b) list of flex boxes (no dynamic spacing over multiple rows, more control)
* OQ buttons (subscribe) and micro-secondary
  * secondary style for action - so no more need nest them in one item menus...
* OQ create new list on home page, how to layout?
  * grid of small icons + one create button?
* TODO link should cover whole li, i.e. cant use <a>
* TODO on list page: bookmark / remove bookmark menu item toggle button

* idea: optional collection meta: last item (useful if activity is hosted)

```
class User(micro.User):
    class Lists(Collection):
        """
        Bookmarked lists.

        Lists are auto added to the bookmarks if user creates it and if user makes first action on
        list.
        """

        def add(self, list, user):
            """
            .. http:post:: /users/(id)/lists

            {list_id}

            Bookmark list with *list_id*.
            """
            pass

        def remove(self, list, user):
            """
            .. http:delete:: /users/(id)/lists/(list-id)

            Unbookmark list with *list_id*.
            """
            pass

    @property
    def lists(self):
        """
        .. http:get:: /users/(id)/lists
        """
        pass
```

* Dashboard
start page alwasy reachable via ui logo. dashboard via user menu
ui init: if user has a list -> dashboard
