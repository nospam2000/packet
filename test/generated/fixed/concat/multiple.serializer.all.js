module.exports = function ({ serializers }) {
    serializers.all.object = function () {


        return function (object) {
            return function ($buffer, $start, $end) {
                let $_, $i = []

                $_ = $start
                object.array.copy($buffer, $start)
                $start += object.array.length
                $_ += object.array.length

                $_ = 8 - $_
                $buffer.fill(Buffer.from([ 0xa, 0xb ]), $start, $start + $_)
                $start += $_

                for ($i[0] = 0; $i[0] < object.sentry.length; $i[0]++) {
                    $buffer[$start++] = (object.sentry[$i[0]] & 0xff)
                }

                $buffer[$start++] = 0x0

                return { start: $start, serialize: null }
            }
        }
    } ()
}