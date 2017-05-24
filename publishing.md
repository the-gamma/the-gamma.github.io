---
layout: page
title: Data
subtitle: Providing data as a REST services
description: When using The Gamma, you need to specify data sources like the 'olympics' value used 
  in the homepage examples. This is done by creating a simple REST service that provides the data
  and handles queries generated from The Gamma editor and interpreter. If you want to build your
  own data source for The Gamma, continue reading!
permalink: /publishing/
---

The easiest way to provide your own data for The Gamma is to use the pivot type provider.
This will expose data in a way that lets the user perform data aggregation, sorting and filtering
as illustrated by the Olympic example on the [home page](/). The pivot type provider is used to
define the `olympics` value - which is then automatically augmented with all the aggregation 
operations. The pivot type provider is currently restricted to tabular (CSV-like) data,
although this might change in the future.

The other, more general, option is to use the `g.providers.rest` type provider mentioned in the
[developers section](/developers), but this is somewhat limited and work-in-progress in the 
current first release.

## Understanding pivot data services

With the pivot type provider, all you have to do is to create a simple REST service (which can 
be written in any language) that returns basic metadata about your data source and can evaluate
queries written using The Gamma.

The query evaluation is done on the server rather than the client. This lets you expose large
data sets that would not be easy to download (the results of the query are typically smaller and
can be truncated), but it means some more logic is needed on the server.

Assuming you specify `http://example.com/olympics` as your data source. When you create the type
provider, it will first make request with `?metadata` query to get information about the columns
that your data set contains. The response should be a JSON record with column names as keys and
types (`number` or `string`) as values:

```
GET http://example.com/olympics?metadata
```

```js
{ "Games":"string", "Year":"number", "Event":"string",
  "Discipline":"string", "Athlete":"string", 
  "Sport":"string", "Gender":"string", "Team":"string",
  "Event":"string", "Medal":"string", "Gold":"number",
  "Silver":"number", "Bronze":"number" }
```

This is all the pivot type provider needs to generate most of the members that are available
in the auto-completion list. When you finish writing code and run it, another request is issued
to get the data. For the [homepage](/) example where we look at Rio 2016, group data by Athlete,
sum number of Gold medals for each athlete, sort the results by the number of medals, take the top
3 and then get a data series with athlete and the number of medals, the query looks as follows:

```
GET http://example.com/olympics?
  filter(Games eq Rio (2016))$
  groupby(by Athlete,sum Gold,key)$
  sort(Gold desc)$take(3)$series(Athlete,Gold)
```  

```js
[ [ "Michael Phelps", 5 ], 
  [ "Katie Ledecky", 4 ], 
  [ "Simone Biles", 4 ] ]
```

As you can see, parts of the query are separated by `$` and they represent the individual steps
of the data transformation. The part `series(Athlete,Gold)` at the end specifies what data we
want to get - here, we want to get the result as a _series_, which is a simple list of key value
pairs, stored as nested lists.

When the request does not end with `series`, we need to return data as a list of records (a series
always has just keys and values, while a record has multiple fields). This is also used in the live
editor which also specifies `&preview` (to let your service know that it only needs top 20 results
and the results don't need to be accurate).

```
GET http://example.com/olympics?
  filter(Games eq Rio (2016))$
  groupby(by Athlete,sum Gold,sum Silver,key)$
  sort(Gold desc)$take(3)&preview`
```

```js
[ { "Athlete": "Michael Phelps", "Gold": 5, "Silver": 1 }, 
  { "Athlete": "Katie Ledecky", "Gold": 4, "Silver": 1 }, 
  { "Athlete": "Simone Biles", "Gold": 4, "Silver": 0 } ]
```

In the `groupby` clause, we first specify one or more grouping keys using `by` and then we include
aggregations that should be applied over the group. Here, we return the grouping keys (`key`) and
we sum the number of gold and silver medals (`sum Gold` and `sum Silver`). Those are then returned
in the result - as we are not requesting a series, the result is a list of records with all the 
data we collected.

Finally, when using `filter`, the pivot type provider also needs to know the range (all possible 
values) of a value. So, when you type `olympics.'filter data'.'Games is'.` in the editor, the 
following request is made to get all Olympic games:

```
GET http://example.com/olympics?range(Games)
```

```js
[ "Athens (1896)", "Paris (1900)", "St Louis (1904)", 
  "London (1908)", "Stockholm (1912)", (...), 
  "Beijing (2008)", "London (2012)", "Rio (2016)" ]
```

## Query language details

The previous section should give you some idea about what kind of queries the service needs to
handle. The rest of the page lists all the possible options. Note that in the above example, the
column names were all nice such as `Games`. If your column name contains whitespace or 
non-alpha-numeric characters, it will be quoted as `'Hosting city'`. 

The query string passed to the service may be either just `?<query>` specifying a query or
`?<query>&preview` (or just `?preview`) which indicates that the service should return only 
top few elements (10 or 20 is typically good).

The `<query>` part is a sequence of transformations separated by `$` such as
`<transform>$...$<transform>` where a single `<transform>` can be:

 - `filter([and|or],<cond>,<cond>,...)` specifies we should only return rows matching given conditions;
   `<cond>` is either `<field> eq <value>` or `<field> neq <value>` requiring the given field
   to be (or not to be) a given value. The first parameter specifies how multiple conditions are
   combined (with `and` being the default value if the parameter is missing).
 - `drop(<field>,<field>,...)` specifies that the given fields should be dropped from the results
 - `sort(<sort>,<sort>,...)` specifies how data should be sorted; `<sort>` can be either
   `<field> desc` (sort descendingly by a field) or `<field> asc`.
 - `take(<num>)` or `skip(<num>)` are used for paging
 - `groupby(by <field>,by <field>,...,<agg>,<agg>,...)` specifies that data should be grouped 
   using the given fields (specified in `by`) as keys; for each group, the specified aggregations
   `<agg>` (see below) should be applied to obtain aggregated fields

The `<agg>` aggregations produce summarized value which has the same column name as the source
column of the summarization. The following aggregations are available:

  - `key` return the key(s) of the group using their original column names
  - `count-all` count the number of rows in the group and return it as column `count`
  - `count-dist <field>` count the number of distinct values of the given field
  - `unique <field>` return the value of the `<field>` assuming it is unique over the group
  - `sum <field>` sum the value of the numerical `<field>` column
  - `mean <field>` get the average of the numerical `<field>` column

Finally, the last `<transform>` in the sequence of transformations separated by `$` can also be
one of the following (if the last transform is not one of the following, you should just return
the data after applying previous transformations as a list of JSON objects)

 - `series(<field>,<field>)` specifies that the result should be a JSON array of two-element 
    arrays (series) containing the given two `<field>` columns as key and value 
 - `metadata` specifies that the result should be column names and types of the data set
   (currently, this is never preceded by any other transformations)
 - `range(<field>)` specifies that we want to get the range of values (as a JSON array)
   for the given field after applying the preceding transformations

## Sample pivot data services

Currently, the best example available is the F# implementation of the service that provides
[Olympic medalists data](https://github.com/the-gamma/thegamma-services/blob/master/src/pdata/server.fsx).
Adding more sample services is high on our list of priorities, but it might also be a good
area where you can help the project! If you're interested in writing a sample data service in 
a language other than F#, check out the [/contributing](contributing page) and get in touch!
