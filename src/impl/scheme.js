const x = [{ "type": 3, "values": [{ "type": 10, "properties": ["Gotham City", "New York City"] }], "property": { "table": { "name": "superheroes", "alias": "" }, "name": "origin", "alias": "", "type": -1 } }]


var query = newQuery().select('name', 'origin').from('superheroes').where('origin').is.eq('Gotham City');

[
    {
        type: eq,
        value: 'Gotham City',
        prop: { "table": { "name": "superheroes", "alias": "" }, "name": "origin", "alias": "", "type": -1 }
    }
]

var query = newQuery().select('name', 'origin').from('superheroes').where('origin').is.eq('Gotham City').or.is.eq('New York City');
var query = newQuery().select('name', 'origin').from('superheroes').where('origin').is.eq(or('Gotham City', 'New York City'));

[
    {
        type: or,
        exp: [
            {
                type: eq,
                value: 'Gotham City',
                prop: { "table": { "name": "superheroes", "alias": "" }, "name": "origin", "alias": "", "type": -1 }
            },
            {
                type: eq,
                value: 'New York City',
                prop: { "table": { "name": "superheroes", "alias": "" }, "name": "origin", "alias": "", "type": -1 }
            }
        ]
    }
]

var query = newQuery().select('name', 'origin').from('superheroes').where('origin').or.where('xxx').are.eq('Gotham City');
var query = newQuery().select('name', 'origin').from('superheroes').where('origin', 'xxx').is.eq('Gotham City');

[
    {
        type: and,
        exp: [
            {
                type: eq,
                value: 'Gotham City',
                prop: { "table": { "name": "superheroes", "alias": "" }, "name": "origin", "alias": "", "type": -1 }
            },
            {
                type: eq,
                value: 'Gotham City',
                prop: { "table": { "name": "superheroes", "alias": "" }, "name": "xxx", "alias": "", "type": -1 }
            },
        ]
    }
]

var query = newQuery().select('name', 'origin').from('superheroes').where('origin').or.where('xxx').are.eq('Gotham City').or.is.eq('New York');
var query = newQuery().select('name', 'origin').from('superheroes').where('origin', 'xxx').is.eq(or('Gotham City', 'New York'));

[
    {
        type: and,
        exp: [
            {
                type: or,
                exp: [
                    {
                        type: eq,
                        value: 'Gotham City',
                        prop: { "table": { "name": "superheroes", "alias": "" }, "name": "origin", "alias": "", "type": -1 }
                    },
                    {
                        type: eq,
                        value: 'New York',
                        prop: { "table": { "name": "superheroes", "alias": "" }, "name": "origin", "alias": "", "type": -1 }
                    },
                ]
            },
            {
                type: or,
                exp: [
                    {
                        type: eq,
                        value: 'Gotham City',
                        prop: { "table": { "name": "superheroes", "alias": "" }, "name": "xxx", "alias": "", "type": -1 }
                    },
                    {
                        type: eq,
                        value: 'New York',
                        prop: { "table": { "name": "superheroes", "alias": "" }, "name": "xxx", "alias": "", "type": -1 }
                    },
                ]
            },
        ]
    }
]


/*

SELECT * FROM ... WHERE (a = 1 OR b = 1) AND (c=1 OR d=1)
select().from().WRAP(where(or(a,b)).are.eq(1)).and.WRAP(where(or(c,d)).are.eq(1))

$and:[
    { $or: [{a: 1}, {b: 1}] },
    { $or: [{c: 1}, {d: 1}] }
]


SELECT * FROM ... WHERE (a = 1 OR b = 1) AND c=1
select().from().WRAP(where(or(a,b)).are.eq(1)).and.where(c).is.eq(1)

$and:[
    { $or: [{a: 1}, {b: 1}] },
    {c: 1}
]

SELECT * FROM ... WHERE c=1 AND (a = 1 OR b = 1)
select().from().where(c).is.eq(1).and.WRAP(where(or(a,b)).are.eq(1))

$and:[
    {c: 1},
    { $or: [{a: 1}, {b: 1}] }
]

SELECT * FROM ... WHERE (c=1)
select().from().WRAP(where(c).is.eq(1))

$and:[
    {c: 1},
    {c: 1}
]

select().from().WRAP(where(or(a,b)).are.eq(or(1,2))).and.WRAP(where(or(c,d)).are.eq(1))


*/