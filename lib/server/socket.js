var net = require('net');
var clientEvents = require('./client_events.js').clientEvents;

module.exports.Socket = function(sockjsConn, remoteSocketId, host, port, options) {
  var EVENTS = ["connect", "data", "end", "close", "timeout", "drain", "error"];

  this.sockjsConn = sockjsConn;
  this.remoteSocketId = remoteSocketId;
  this.remoteAddress = host;
  this.remotePort = port;
  options = options || {};
  
  var self = this;

  this.options = {
    //Makes the 'data' event emit a string instead of a Buffer.
    //Can be 'utf8', 'utf16le' ('ucs2'), 'ascii', or 'hex'
    encoding: options.encoding || 'utf8', 

    //Sets the socket to timeout after timeout milliseconds of inactivity on the socket
    timeout: options.timeout || 0,

    //Disables the Nagle algorithm
    noDelay: options.noDelay || true, 

    keepAlive: options.keepAlive || false, 

    //Set the delay between the last data packet received and the first keepalive probe
    initialDelay: options.initialDelay || 0
  }

  this.createPacket = function() { 
    return {
      sID: this.remoteSocketId,
      eventName: null,
      data: null
    }
  }

  this.setOptions = function() {
    this.client.setEncoding(this.options.encoding);
    this.client.setTimeout(this.options.timeout);
    this.client.setNoDelay(this.options.noDelay);
    this.client.setKeepAlive(this.options.keepAlive, this.options.initialDelay);
  }

  this.client = new net.Socket();
  this.client.connect(this.remotePort, this.remoteAddress, function() { 
    self.setOptions();
  });


  this.mapEvent = function(eventName) {
    this.client.on(eventName, function(data){
      if(data) data = data.toString();
      self.emitClientEvent(eventName, data); 

      // also delete socket object if one of these events happened
      if (["end", "close", "timeout"].indexOf(eventName) != -1) 
        delete websockets[self.remoteSocketId];

    });
  }

  //map sock events to client's sock events
  this.mapEvents = function(events) {
    for(i in events) 
      this.mapEvent.call(this, events[i]);
  }

  this.mapEvents.call(this, EVENTS);

  this.getSockOpts = function() {
    var sockOpts = {
      _pendingWriteReqs: this.client._pendingWriteReqs,
      _connectQueueSize: this.client._connectQueueSize,
      destroyed:         this.client.destroyed,
      errorEmitted:      this.client.errorEmitted,
      bytesRead:         this.client.bytesRead,
      bytesWritten:      this.client.bytesWritten,
      allowHalfOpen:     this.client.allowHalfOpen,
      _connecting:       this.client._connecting,
      writable:          this.client.writable,
      readable:          this.client.readable,
    }

    this.emitClientEvent("SockOptsRcv", sockOpts); 
  }

}

module.exports.Socket.prototype = new clientEvents();