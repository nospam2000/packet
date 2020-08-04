module.exports = function ({ $incremental, $lookup }) {
    return {
        object: function () {
            return function (object) {
                return function ($buffer, $start, $end) {
                    let $i = []

                    if ($end - $start < 1) {
                        return $incremental.object(object, 0, $i)($buffer, $start, $end)
                    }

                    $buffer[$start++] = object.nudge & 0xff

                    if ($end - $start < 8) {
                        return $incremental.object(object, 2, $i)($buffer, $start, $end)
                    }

                    for ($i[0] = 0; $i[0] < object.array.length; $i[0]++) {
                        $buffer[$start++] = object.array[$i[0]] & 0xff
                    }

                    for (;;) {
                        if ($i[0] == 8) {
                            break
                        }
                        $buffer[$start++] = 0x0
                        $i[0]++
                    }

                    if ($end - $start < 1) {
                        return $incremental.object(object, 6, $i)($buffer, $start, $end)
                    }

                    $buffer[$start++] = object.sentry & 0xff

                    return { start: $start, serialize: null }
                }
            }
        } ()
    }
}
