module.exports = function ({ $lookup }) {
    return {
        object: function () {
            return function ($buffer, $start) {
                let $i = [], $I = []

                let object = {
                    nudge: 0,
                    array: [],
                    sentry: 0
                }

                object.nudge = $buffer[$start++]

                $I[0] = (() => 2)()

                $i[0] = 0
                do {
                    object.array[$i[0]] = []

                    $I[1] = $buffer[$start++]
                    $i[1] = 0

                    for (; $i[1] < $I[1]; $i[1]++) {
                        object.array[$i[0]][$i[1]] = $buffer[$start++]
                    }
                } while (++$i[0] != $I[0])

                object.sentry = $buffer[$start++]

                return object
            }
        } ()
    }
}
