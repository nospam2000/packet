module.exports = function ({ $incremental, $lookup }) {
    return {
        object: function () {
            return function (object) {
                return function ($buffer, $start, $end) {
                    let $$ = []

                    if ($end - $start < 1 + 1) {
                        return $incremental.object(object, 0, $$)($buffer, $start, $end)
                    }

                    ; (({ value = 0 }) => require('assert').equal(value, 1))({
                        value: object.value
                    })

                    $buffer[$start++] = object.value & 0xff

                    $buffer[$start++] = object.sentry & 0xff

                    return { start: $start, serialize: null }
                }
            }
        } ()
    }
}
