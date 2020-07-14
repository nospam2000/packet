module.exports = function ({ serializers }) {
    serializers.all.object = function () {


        return function (object) {
            return function ($buffer, $start, $end) {
                let $_, $i = []

                $_ = $start
                object.array.copy($buffer, $start)
                $start += object.array.length
                $_ += object.array.length

                $buffer[$start++] = (object.sentry & 0xff)

                return { start: $start, serialize: null }
            }
        }
    } ()
}
