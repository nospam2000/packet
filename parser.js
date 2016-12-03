var acorn = require('acorn')
var assert = require('assert')
var escodegen = require('escodegen')

function dump (node) {
    console.log(require('util').inspect(node, { depth: Infinity }))
}

function visitPropertyParse (node) {
    assert(node.type == 'FunctionExpression')
    assert(node.params[0].name == 'object')
    node.body.body.forEach(function (node) {
        assert(node.type == 'ExpressionStatement')
        node = node.expression
        assert(node.type == 'CallExpression')
        switch (node.callee.name) {
        case 'unsigned':
            var arg, name, value

            arg = node.arguments[0]
            assert(arg.type == 'MemberExpression')
            assert(arg.object.name == 'object')
            assert(arg.property.type == 'Identifier')
            name = arg.property.name

            value = node.arguments[1].value
            console.log({
                name: name,
                type: 'integer',
                endianness: 'b',
                bits: value
            })
        }
    })
}

function createConditions (parameters, conditions, node) {
    var condition = {
        test: escodegen.generate(node.test),
        fields: []
    }
    conditions.push(condition)
    visitPropertySerialize(parameters, node.consequent.body, condition.fields)
    if (node.alternate.type == 'IfStatement') {
        createConditions(parameters, conditions, node.alternate)
    } else {
        var condition = {
            fields: []
        }
        conditions.push(condition)
        visitPropertySerialize(parameters, node.alternate.body, condition.fields)
    }
}

// TODO It is simple enought to look and ensure that `_` is not called inside a
// while loop, so that `_` is only called in the body of the function. It would
// be a lot of rewriting to get it to where you could include incrementalism
// anywhere, unrolling loops, switch statements, etc.
function visitPropertySerialize (parameters, body, fields) {
    body.forEach(function (node) {
        if (node.type == 'IfStatement') {
            var conditional = {
                type: 'condition',
                conditions: []
            }
            createConditions(parameters, conditional.conditions, node)
            fields.push(conditional)
        } else {
            assert(node.type == 'ExpressionStatement')
            node = node.expression
            assert(node.type == 'CallExpression')
            assert(node.callee.name == '_')

            var arg = node.arguments[0]
            console.log(arg)
            if (arg.type == 'Identifier') {
                assert(arg.name == 'object')
                arg = node.arguments[1]
                assert(arg.type == 'ObjectExpression')
                var integer = {
                    type: 'integer',
                    fields: []
                }
                arg.properties.forEach(function (property) {
                    assert(property.type == 'Property')
                    integer.fields.push({
                        type: 'integer',
                        name: property.key.name,
                        endianness: 'b',
                        bits: property.value.value
                    })
                })
                fields.push(integer)
            } else {
                assert(arg.type == 'MemberExpression')
                assert(arg.object.name == 'object')
                assert(arg.property.type == 'Identifier')
                var name = arg.property.name

                var arg = node.arguments[1]
                var value = arg.value

                fields.push({
                    name: name,
                    type: 'integer',
                    endianness: 'b',
                    bits: value
                })
            }
        }
    })
}

function walk (source) {
    var node = acorn.parse(source)
    var structures = { parse: [], serialize: [] }

    assert(node.type == 'Program', 'program expected')

    node.body.forEach(function (node) {
        assert(node.type == 'ExpressionStatement')
        assert(node.expression.left.type == 'MemberExpression')
        assert(node.expression.left.object.name == 'packets')
        assert(node.expression.left.property.type == 'Identifier')
        var name = node.expression.left.property.name

        assert(node.expression.right.type == 'FunctionExpression')
        var parameters = node.expression.right.params.map(function (node) {
            return node.name
        })
        var body = node.expression.right.body.body
        var structure = {
            type: 'structure',
            name: name,
            fields: []
        }
        structures.serialize.push(structure)
        visitPropertySerialize(parameters, body, structure.fields)
        var structure = {
            type: 'structure',
            name: name,
            fields: []
        }
        structures.parse.push(structure)
        visitPropertySerialize(parameters, body, structure.fields)
    })

    return structures
}

exports.walk = walk