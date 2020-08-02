module.exports = function ({ parsers, $lookup }) {
    parsers.all.object = function () {
        return function ($buffer, $start) {
            let $_

            let object = {
                value: 0
            }

            $_ = (
                $buffer[$start++] |
                $buffer[$start++] << 8
            ) >>> 0
            object.value = $_ & 0x8000 ? (0xffff - $_ + 1) * -1 : $_

            return object
        }
    } ()
}
