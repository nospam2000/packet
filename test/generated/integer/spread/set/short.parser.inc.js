module.exports = function ({ $lookup }) {
    return {
        object: function () {
            return function (object, $step = 0) {
                let $_

                return function $parse ($buffer, $start, $end) {
                    switch ($step) {
                    case 0:

                        object = {
                            nudge: 0,
                            value: 0,
                            sentry: 0
                        }

                    case 1:

                    case 2:

                        if ($start == $end) {
                            $step = 2
                            return { start: $start, object: null, parse: $parse }
                        }

                        object.nudge = $buffer[$start++]

                    case 3:

                        $_ = 0

                    case 4:

                        if ($start == $end) {
                            $step = 4
                            return { start: $start, object: null, parse: $parse }
                        }

                        $_ += $buffer[$start++] & 127 << 7

                    case 5:

                        if ($start == $end) {
                            $step = 5
                            return { start: $start, object: null, parse: $parse }
                        }

                        $_ += $buffer[$start++] << 0

                        object.value = $_

                    case 6:

                    case 7:

                        if ($start == $end) {
                            $step = 7
                            return { start: $start, object: null, parse: $parse }
                        }

                        object.sentry = $buffer[$start++]

                    }

                    return { start: $start, object: object, parse: null }
                }
            }
        } ()
    }
}
