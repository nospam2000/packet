module.exports = function ({ $incremental, $lookup }) {
    return {
        object: function () {
            return function (object) {
                return function ($buffer, $start, $end) {
                    let $$ = []

                    $$[0] = (function ({ $_, $, $path, $i, $direction }) {
                        const assert = require('assert')
                        if ($direction == 'serialize') {
                            assert.deepEqual({ $_, $, $path, $i, $direction }, {
                                $_: 1,
                                $: { value: 1, sentry: 0xaa },
                                $path: [ 'object', 'value' ],
                                $i: [],
                                $direction: 'serialize'
                            })
                        } else {
                            assert.deepEqual({ $_, $, $path, $i, $direction }, {
                                $_: 4294967294,
                                $: { value: 4294967294, sentry: 0 },
                                $path: [ 'object', 'value' ],
                                $i: [],
                                $direction: 'parse'
                            })
                        }
                        return ~$_
                    })({
                        $_: object.value,
                        $: object,
                        $path: [ 'object', 'value' ],
                        $i: [],
                        $direction: 'serialize'
                    })

                    if ($end - $start < 4) {
                        return $incremental.object(object, 1, $$)($buffer, $start, $end)
                    }

                    $buffer[$start++] = $$[0] >>> 24 & 0xff
                    $buffer[$start++] = $$[0] >>> 16 & 0xff
                    $buffer[$start++] = $$[0] >>> 8 & 0xff
                    $buffer[$start++] = $$[0] & 0xff

                    if ($end - $start < 1) {
                        return $incremental.object(object, 3, $$)($buffer, $start, $end)
                    }

                    $buffer[$start++] = object.sentry & 0xff

                    return { start: $start, serialize: null }
                }
            }
        } ()
    }
}
