module.exports = {
    object: function () {
        return function (object) {
            let $start = 0, $i = []

            $start += 1

            for ($i[0] = 0; $i[0] < object.array.length; $i[0]++) {
                $start += 1

                $start += 1 * object.array[$i[0]].length
            }

            $start += 1

            return $start
        }
    } ()
}
