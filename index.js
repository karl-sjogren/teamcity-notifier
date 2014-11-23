var http = require('http'),
    events = require('events');

var TeamCity = function(config) {
  this.config = config;
  this.runningBuilds = [];
};

TeamCity.prototype = new events.EventEmitter;

TeamCity.prototype.start = function() {
  var that = this;
  that.interval = setInterval(function() {
    var req = http.request({
      host: that.config.host,
      path: '/app/rest/builds?locator=running:any,canceled:any',
      port: that.config.port,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + new Buffer(that.config.user + ':' + that.config.password).toString('base64')
      }
    }, function(res) {
      
      var buffer = '';
      res.on('data', function (chunk) {
        buffer += chunk;
      });
      
      res.on('end', function () {
        if(buffer.indexOf('Incorrect username or password') === 0) {
          that.emit('unauthorized');
          return;
        }
        
        var data = JSON.parse(buffer);
        var running = data.build.filter(function(build) {
          return build.state === 'running';
        });
                
        running.forEach(function(build) {
          var matchingBuilds = that.runningBuilds.filter(function(runningBuild) {
            return build.id === runningBuild.id;
          });
          
          var exists = matchingBuilds.length > 0;
          
          if(!exists) {
            that.runningBuilds.push(build);
            that.emit('new-build', build);
          } else {
            var oldBuild = matchingBuilds[0];
            
            if(oldBuild.status !== build.status) {
              that.emit('status-changed', oldBuild, build);
            }              
            
            if(oldBuild.state !== build.state) {
              that.emit('state-changed', oldBuild, build);
            }
          }
        });
        
        var finishedBuilds = that.runningBuilds.filter(function(runningBuild) {
          return data.build.some(function(build) {
            return build.id === runningBuild.id && build.state === 'finished';
          });
        });
        
        finishedBuilds.forEach(function(build) {
          that.emit('finished-build', build);
          that.runningBuilds.splice(that.runningBuilds.indexOf(build), 1);
        });
      });
    });
    
    req.on('error', function(e) {
      that.emit('error', e);
    });
    
    req.end();
    
  }, this.config.interval || 1000);
};

TeamCity.prototype.stop = function() {
  if(!!this.interval) {
    clearInterval(this.interval);
  }
};

module.exports = TeamCity;