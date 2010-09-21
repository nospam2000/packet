parsePattern = require('./pattern').parse
ieee754 = require('./ieee754')

hex = (bytes) ->
  h = bytes.map (b) ->
    if b < 10
      "0" + b.toString(16)
    else
      b.toString(16)
  h.join("")

noop = (value) -> value

class Packet
  constructor: ->
    @packets = {}
    @reset()
    @fields = []
    @transforms = Object.create(transforms)

  clone: ->
    copy            = new (this.constructor)()
    copy.packets    = Object.create(packets)
    copy

  packet: (name, pattern, callback) ->
    callback      or= noop
    pattern         = parsePattern(pattern)
    @packets[name]  = {pattern, callback}

  # Resets the bytes read, bytes written and the current pattern. Used to
  # recover from exceptional conditions and generally a good idea to call this
  # method before starting a new series of packet parsing transitions.
  reset: ->
    @bytesRead = 0
    @bytesWritten = 0
    @pattern = null
    @callback = null

  # Setup the next field in the current pattern to read or write.
  next: ->
    reading     = not @outgoing
    pattern     = @pattern[@patternIndex]
    little      = pattern.endianness == 'l'
    bytes       = pattern.bytes

    if @outgoing
      if @padding?
        value = @padding
      else if pattern.arrayed
        value = @outgoing[@patternIndex][@index]
      else
        value = @outgoing[@patternIndex]
      if pattern.unpacked
        value = @pack(value)
    else
      if pattern.unpacked
        value = []
      else
        value = 0

    @value      = value
    @offset     = if little then 0 else bytes - 1
    @increment  = if little then 1 else -1
    @terminal   = if little then bytes else -1

  unpack: ->
    bytes   = @value
    pattern = @pattern[@patternIndex]
    if pattern.type == "h"
      hex bytes.reverse()
    else if pattern.type == "f"
      if pattern.bits == 32
        ieee754.fromIEEE754Single(bytes)
      else
        ieee754.fromIEEE754Double(bytes)
    else if pattern.signed
      value = 0
      if (bytes[bytes.length - 1] & 0x80) == 0x80
        top = bytes.length - 1
        for i in [0...top]
          value += (~bytes[i] & 0xff)  * Math.pow(256, i)
        # ~1 == -2.
        # To get the two's compliment as a positive value you use ~1 & 0xff == 254. 
        value += (~(bytes[top] & 0x7f) & 0xff & 0x7f) * Math.pow(256, top)
        value += 1
        value *= -1
      value
    else
      bytes

  pack: (value) ->
    pattern = @pattern[@patternIndex]
    if pattern.type == "f"
      if pattern.bits == 32
        ieee754.toIEEE754Single value
      else
        ieee754.toIEEE754Double value
    else
      value

bufferize = (array) ->
  buffer = new Buffer(array.length)
  for b, i in array
    buffer[i] = b
  buffer

transforms =
  str: (encoding, parsing, field, value) ->
    if parsing
      length = value.length
      length-- if field.terminator
      value.toString(encoding, 0, length)
    else
      value += "\0" if field.terminator
      new Buffer(value, encoding)
  pad: (character, length, parsing, field, value) ->
    if not parsing
      while value.length < length
        value = character + value
    value

  atoi: (base, parsing, field, value) ->
    if parsing then parseInt(value, base) else value.toString()

  atof: (base, parsing, field, value) ->
    if parsing then parseFloat(value) else value.toString()

module.exports.Parser = class Parser extends Packet
  data: (data...)   -> @user = data

  getBytesRead:     -> @bytesRead

  # Set the next packet to parse by providing a named packet name or a packet
  # pattern, with an optional `callback`. The optional `callback` will override
  # the callback assigned to a named pattern.
  parse: (nameOrPattern, callback) ->
    packet        = @packets[nameOrPattern] or {}
    pattern       = packet.pattern or parsePattern(nameOrPattern)
    callback    or= packet.callback or noop

    @pattern      = pattern
    @callback     = callback
    @patternIndex = 0
    @repeat       = pattern[0].repeat
    @skipping     = 0
    @index        = 0
    @terminated   = !@pattern[0].terminator

    @next()
    if @pattern[@patternIndex].arrayed
      @fields.push([])

##### parser.read(buffer[, offset][, length])
# The `read` method reads from the buffer, returning when the current pattern is
# read, or the end of the buffer is reached.

  # Read from the `buffer` for the given `offset` and length.
  read: (buffer, offset, length) ->
    offset or= 0
    length or= buffer.length
    start    = @bytesRead
    end      = offset + length

    # We set the pattern to null when all the fields have been read, so while
    # there is a pattern to fill and bytes to read.
    b
    while @pattern != null and offset < end
      if @skipping
        advance      = Math.min(@skipping, end - offset)
        offset      += advance
        @skipping   -= advance
        @bytesRead  += advance
        return @bytesRead - start if @skipping

      else
        # If the pattern is unpacked, the value we're populating is an array.
        if @pattern[@patternIndex].unpacked
          loop
            b = buffer[offset]
            @bytesRead++
            offset++
            @value[@offset] = b
            @offset += @increment
            break if @offset is @terminal
            return @bytesRead - start if offset is end

        # Otherwise we're packing bytes into an unsigned integer, the most
        # common case.
        else
          loop
            b = buffer[offset]
            @bytesRead++
            offset++
            @value += Math.pow(256, @offset) * b
            @offset += @increment
            break if @offset == @terminal
            return @bytesRead - start if offset is end

        # Unpack the field value.
        field = @unpack()

        # If we are filling an array field the current fields is an array,
        # otherwise current field is the value we've just read.
        if @pattern[@patternIndex].arrayed
          @fields[@fields.length - 1].push(field)
        else
          @fields.push(field)


      # If we've not yet hit our terminator, check for the terminator. If we've
      # hit the terminator, and we do not have a maximum size to fill, then
      # terminate by setting up the array to terminate.
      if not @terminated
        if @pattern[@patternIndex].terminator.charCodeAt(0) == field
          @terminated = true
          if @repeat == Number.MAX_VALUE
            @repeat = @index + 1
          else
            @skipping = (@repeat - (++@index)) * @pattern[@patternIndex].bytes
            @repeat = @index + 1
            continue

      # If we are reading an arrayed pattern and we have not read all of the
      # array elements, we repeat the current field type.
      if ++@index <  @repeat
        @next()

      # If we have read all of the pattern fields, call the associated callback.
      # We add the parser and the user suppilied additional arguments onto the
      # callback arguments.
      #
      # The pattern is set to null, our terminal condition, before the callback,
      # because the callback may specify a subsequent packet to parse.
      else if ++@patternIndex == @pattern.length
        # Run the piplines for parsing.
        if @pattern[@patternIndex - 1].transforms
          field = @fields[@fields.length - 1]
          field = bufferize(field) if field.length
          for transform in @pattern[@patternIndex - 1].transforms or []
            parameters = []
            for constant in transform.parameters
              parameters.push(constant)
            parameters.push(true)
            parameters.push(@pattern[@patternIndex - 1])
            parameters.push(field)
            field = @transforms[transform.name].apply null, parameters
          @fields[@fields.length - 1] = field

        @fields.push(this)
        for p in @user or []
          @fields.push(p)

        @pattern        = null

        @callback.apply null, @fields

        @fields.length  = 0

      # Otherwise we proceed to the next field in the packet pattern.
      else
        @next()
        @repeat       = @pattern[@patternIndex].repeat
        @index        = 0
        @skipping     = 0
        @terminated   = !@pattern[@patternIndex].terminator
        if @pattern[@patternIndex].arrayed
          @fields.push([])

    @bytesRead - start

module.exports.Serializer = class Serializer extends Packet
  getBytesWritten: -> @bytesWritten

  serialize: (shiftable...) ->
    if typeof shiftable[shiftable.length - 1] == 'function'
      callback = shiftable.pop()

    nameOrPattern = shiftable.shift()
    packet        = @packets[nameOrPattern] or {}
    pattern       = packet.pattern or parsePattern(nameOrPattern)
    callback    or= packet.callback or noop

    @pattern      = pattern
    @callback     = callback
    @patternIndex = 0
    @outgoing     = shiftable

    @repeat       = pattern[@patternIndex].repeat
    @terminated   = not pattern[@patternIndex].terminator
    @index        = 0
    delete        @padding

    @next()

##### serializer.write(buffer[, offset][, length])
# The `write` method writes to the buffer, returning when the current pattern is
# written, or the end of the buffer is reached.

  # Write to the `buffer` in the region defined by the given `offset` and `length`.
  write: (buffer, offset, length) ->
    offset  or= 0
    length  or= buffer.length
    start     = offset
    end       = offset + length

    # We set the pattern to null when all the fields have been written, so while
    # there is a pattern to fill and space to write.
    while @pattern and offset < end
      if @skipping
        advance         = Math.min(@skipping, end - offset)
        offset         += advance
        @skipping      -= advance
        @bytesWritten  += advance
        return offset - start if @skipping

      else
        # If the pattern is unpacked, the value we're writing is an array.
        if @pattern[@patternIndex].unpacked
          loop
            buffer[offset] = @value[@offset]
            @offset += @increment
            @bytesWritten++
            offset++
            break if @offset is @terminal
            return offset - start if offset is end

        # Otherwise we're unpacking bytes of an unsigned integer, the most common
        # case.
        else
          loop
            buffer[offset] = Math.floor(@value / Math.pow(256, @offset)) & 0xff
            @offset += @increment
            @bytesWritten++
            offset++
            break if @offset is @terminal
            return offset - start if offset is end

      # If we have not terminated, check for the termination state change.
      # Termination will simply change the loop settings, so types that have no
      # terminater start out as terminated, and this does nothing.
      if not @terminated
        if @pattern[@patternIndex].terminator.charCodeAt(0) == @value
          @terminated = true
          if @repeat == Number.MAX_VALUE
            @repeat = @index + 1
          else if @pattern[@patternIndex].padding?
            @padding = @pattern[@patternIndex].padding
          else
            @skipping = (@repeat - (++@index)) * @pattern[@patternIndex].bytes
            @repeat = @index + 1
            continue

      # If we are reading an arrayed pattern and we have not read all of the
      # array elements, we repeat the current field type.
      if ++@index < @repeat
        @next()

      # If we have written all of the packet fields, call the associated
      # callback with this parser.
      #
      # The pattern is set to null, our terminal condition, before the callback,
      # because the callback may specify a subsequent packet to parse.
      else if ++@patternIndex is @pattern.length
        @pattern = null
        @callback.apply null, [ this ]

      else

        delete        @padding
        @repeat       = @pattern[@patternIndex].repeat
        @terminated   = not @pattern[@patternIndex].terminator
        @index        = 0

        @next()

    @outgoing = null

    offset - start

module.exports.Structure = class Structure
  constructor: (pattern) ->
    @parser = new Parser()
    @parser.packet("structure", pattern)

    @serializer = new Serializer()
    @serializer.packet("structure", pattern)

  sizeOf: (values...) -> 0

  read: (buffer, offset, callback) ->
    callback = offset if typeof callback is "function" and not callback?
    @parser.reset()
    @parser.parse("structure", callback)
    @parser.read(buffer, offset, Number.MAX_VALUE)

  write: (values...) ->
    buffer = values.shift()

