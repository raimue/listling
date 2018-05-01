# Votes

# List

def add(id):
    r.rpush(key, id)

def remove(id):
    r.lrem(key, 1, id)

def move(id, to):
    r.lrem(key, 1, id)
    if to:
        r.linsert(key, 'after', to, id)
    else:
        r.lpush(key, id)

def contains(id): # XXX
    return id in r.lrange(key, 0, -1)

def update(id, score): # XXX
    r.lrem(key, 1, id)
    items = [json.loads(r.get(i)) for i in r.lrange(key, 0, -1)]
    to_i, to = next((i, item in enumerate(items) if score > item['score']), (None, None))
    if to:
        r.linsert(key, 'before', to['id'], id)
        return to_i
    else:
        r.rpush(key, id)
        return len(items) - 1

def sort(crit): # XXX
    items = sorted(json.loads(item) for item in r.zrange(key, 0, -1), lambda item: item['crit'])
    r.delete(key)
    r.rpush(key, *(item['id'] for item in items))

# Sorted Set

def add(id):
    r.zadd(key, (r.zcard(key), id))

def remove(id): # XXX
    items = r.zrangebyscore(r.zscore(key, id) + 1, '+inf', withscore=True)
    r.zrem(key, id)
    r.zadd(key, *((i[0] - 1, i[1]) for i in items)) # insert same pricinple, just +1

def move(id, to): # XXX
    i, to_i = r.zscore(key, id), r.zscore(key, to) if to else -1
    if i < to_i: # down
        start, stop, incr, target = i + 1, to_i, -1, to_i
    else:
        start, stop, incr, target = to_i + 1, i - 1, 1, to_i + 1
    items = r.zrangebyscore(start, stop, withscore=True)
    r.zadd(key, *((i[0] + incr, i[1]) for i in items))
    r.zadd(key, (target, id))

def contains(id):
    return r.zrank(key, id) is not None

def update(id, score):
    r.zadd(key, (score, id))
    return r.zrank(key, id)

def sort(crit) # XXX
    items = [json.loads(item) for item in r.zrange(key, 0, -1)]
    r.zadd(key, *(item[crit], item['id'] for item in items))
    #r.zadd(key, *(i, item for i, item in enumerate(r.zrange(key, 0, -1))))

# MULTI

def add(item):
    r.rpush(list_key, item.id)
    r.zadd(votes_key, (len(item.votes), item.id))
    r.zadd(time_key, (item.time.time, item.id))
    r.zadd(tag_key, (0, '{}\0{}'.format(item.tags[0], item.id)))

def remove(item):
    r.lrem(list_key, 1, item.id)
    r.zrem(votes_key, item.id)
    r.zrem(time_key, item.id)
    r.zrem(tag_key, '{}\0{}'.format(item.tags[0], item.id))

def move(item, to):
    r.lrem(key, 1, item.id)
    if to:
        r.linsert(key, 'after', to.id, item.id)
    else:
        r.lpush(key, item.id)

def contains(id):
    return r.zscore(time_key, id) is not None

def _update(item, key, score):
    # _update(item, votes_key, len(item.votes))
    # _update(item, time_key, item.time.time)
    # _update(item, tag_key, item.tags[0])
    r.zadd(key, (score, item.id))
    return r.zrank(key, item.id)

def sort(crit):
    self.sorted_by = crit
    self.r.oset(self.id, self)

class List:
    @property
    def items(self):
        indices = {
            'user': JSONRedisSequence(self.r, '{}.items'.format(self.id)),
            'time': ZSequence(self.r, '{}.items.by_time'.format(self.id)),
            'votes': ZSequence(self.r, '{}.items.by_votes'.format(self.id)),
            'tag': ZSequence(self.r, '{}.items.by_tag'.format(self.id))
        }
        return indices[self.sorted_by]

#def _update(item, key, score):
#    # _update(item, votes_key, len(item.votes))
#    # _update(item, time_key, item.time.time)
#    # _update(item, tag_key, item.tags[0])
#    if isinstance(score, tuple):
#        id = '{}\0{}'.format(score[1], item.id)
#        r.zrem(key, '{}\0{}'.format(score[0], item.id))
#        r.zadd(key, (0, id))
#    else:
#        id = item.id
#        r.zadd(key, (score, id))
#    return r.zrank(key, item.id)
