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
