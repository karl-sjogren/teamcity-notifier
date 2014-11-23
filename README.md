teamcity-notifier
=================

Node-project that can fire events when a build fails or is fixed in Teamcity


```js
var TeamCity = require('teamcity-notifier');

var tc = new TeamCity({
  host: 'teamcity-server',
  port: 80,
  user: 'username',
  password: 'password'
});

tc.on('unauthorized', function() {
  console.log('Invalid teamcity credentials, stopping');
  test.stop();
});


tc.on('new-build', function(build) {
  console.log('New build started for ' + build.buildTypeId);
});

tc.on('finished-build', function(build) {
  console.log('Build finished for ' + build.buildTypeId);
});

tc.on('error', function(e) {
  console.log('An error occured: ' + e.message);
  test.stop();
});


tc.on('status-changed', function(oldBuild, newBuild) {
  if(oldBuild.status === 'SUCCESS' && newBuild.status === 'FAILURE') {
    console.log('Build for ' + build.buildTypeId + ' broke!');
  }
});

tc.on('state-changed', function(oldBuild, newBuild) {
  // Well, do something!
});

tc.start();
```