module.exports = function ({ $incremental, $lookup }) {
    return {
        object: function () {
            return function (object) {
                return function ($buffer, $start, $end) {
                    let $I = []

                    if ($end - $start < 1) {
                        return $incremental.object(object, 0, $I)($buffer, $start, $end)
                    }

                    $buffer[$start++] = object.type & 0xff

                    $I[0] = object.array.reduce((sum, buffer) => sum + buffer.length, 0)
                    switch (($ => $.type)(object)) {
                    case 0:

                        if ($end - $start < 1) {
                            return $incremental.object(object, 4, $I)($buffer, $start, $end)
                        }

                        $buffer[$start++] = $I[0] & 0xff

                        break

                    default:

                        if ($end - $start < 2) {
                            return $incremental.object(object, 6, $I)($buffer, $start, $end)
                        }

                        $buffer[$start++] = $I[0] >>> 8 & 0xff
                        $buffer[$start++] = $I[0] & 0xff

                        break
                    }

                    if ($end - $start < 0 + object.array.reduce((sum, buffer) => sum + buffer.length, 0)) {
                        return $incremental.object(object, 8, $I)($buffer, $start, $end)
                    }

                    {
                        for (let i = 0, I = object.array.length; i < I; i++) {
                            object.array[i].copy($buffer, $start, 0, object.array[i].length)
                            $start += object.array[i].length
                        }
                    }

                    if ($end - $start < 1) {
                        return $incremental.object(object, 9, $I)($buffer, $start, $end)
                    }

                    $buffer[$start++] = object.sentry & 0xff

                    return { start: $start, serialize: null }
                }
            }
        } ()
    }
}
