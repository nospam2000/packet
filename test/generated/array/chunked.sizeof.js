module.exports = {
    object: function () {
        return function (object) {
            let $start = 0, $length

            $start += 1

            $length = object.array.reduce((sum, buffer) => sum + buffer.length, 0)

            $start += 1

            $start += $length

            $start += 1

            return $start
        }
    } ()
}
