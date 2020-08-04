module.exports = function ({ $incremental, $lookup }) {
    return {
        object: function () {
            return function () {
                return function ($buffer, $start, $end) {
                    let $i = [], $I = []

                    let object = {
                        nudge: 0,
                        array: [],
                        sentry: 0
                    }

                    if ($end - $start < 1) {
                        return $incremental.object(object, 1, $i, $I)($buffer, $start, $end)
                    }

                    object.nudge = $buffer[$start++]

                    if ($end - $start < 2) {
                        return $incremental.object(object, 3, $i, $I)($buffer, $start, $end)
                    }

                    $I[0] = (
                        $buffer[$start++] << 8 |
                        $buffer[$start++]
                    ) >>> 0
                    $i[0] = 0

                    if ($end - $start < 4 * $I[0]) {
                        return $incremental.object(object, 5, $i, $I)($buffer, $start, $end)
                    }

                    for (; $i[0] < $I[0]; $i[0]++) {
                        object.array[$i[0]] = {
                            first: 0,
                            second: 0
                        }

                        object.array[$i[0]].first = (
                            $buffer[$start++] << 8 |
                            $buffer[$start++]
                        ) >>> 0

                        object.array[$i[0]].second = (
                            $buffer[$start++] << 8 |
                            $buffer[$start++]
                        ) >>> 0
                    }

                    if ($end - $start < 1) {
                        return $incremental.object(object, 10, $i, $I)($buffer, $start, $end)
                    }

                    object.sentry = $buffer[$start++]

                    return { start: $start, object: object, parse: null }
                }
            } ()
        }
    }
}
