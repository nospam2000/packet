module.exports = function ({ parsers, $lookup }) {
    parsers.all.object = function () {
        return function ($buffer, $start) {
            let object = {
                value: 0,
                sentry: 0
            }

            object.value = (
                $buffer[$start++]
            ) >>> 0

            ; (({ value = 0 }) => require('assert').equal(value, 1))({
                value: object.value
            })

            object.sentry = (
                $buffer[$start++]
            ) >>> 0

            return object
        }
    } ()
}
