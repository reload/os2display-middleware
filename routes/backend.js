/**
 * @file
 * Defines the reset API routes used by the back-end.
 */

/**
 * Helper function to check the backend request only comes from the backend.
 */
function accessCheck(req) {
  if (global.config.get('backend').ip === req.ip) {
    return true;
  }
  return false;
}

/**
 * Update screen information.
 */
exports.screenUpdate = function (req, res) {
  if (!accessCheck(req)) {
    res.send(403);
    return;
  };

  if (req.body.token !== undefined) {
    var Screen = require('../lib/screen')
    var instance = new Screen(req.body.token);
    instance.load();
    instance.on('loaded', function() {
      instance.set('name', req.body.name);
      instance.set('screenGroups', req.body.groups);

      // Save the updates.
      instance.save();
      instance.on('saved', function() {
        // Save completed.
        res.send(200);

        // Reload screen to update groups.
        instance.reload();
      });

      // Handle error events.
      instance.on('error', function(data) {
        console.log(data.code + ': ' + data.message);
        res.send(500);
      });
    });
  }
  else {
    res.send(500);
  }
}

/**
 * Implements screen reload.
 *
 * Loads the screen based on screenID and sends reload command.
 */
exports.screenReload = function (req, res) {
  if (!accessCheck(req)) {
    res.send(403);
    return;
  };

  // Reload base on screens.
  if (req.body.screens !== undefined) {
    // Get screen class.
    var Screen = require('../lib/screen');

    var screens = req.body.screens;
    for (var screenID in req.body.screens) {
      console.log(screens[screenID]);
      // Create new screen object.
      var instance = new Screen(undefined, screens[screenID]);
      instance.load();
      instance.on('loaded', function(data) {
        instance.reload();
      });

      instance.on('error', function(data) {
        // @todo send result back.
        console.log(screens[screenID] + ': ' + data.code + ' - ' + data.message);
      });
    }

    res.send(200);
  }
  // Reload based on groups.
  else if (req.body.groups !== undefined) {
    // Get sockets.
    var sio = global.sio;

    var groups = req.body.groups;
    for (var groupsID in groups) {
      sio.sockets.in(groups[groupsID]).emit('reload', {});
    }

    res.send(200);
  }
  else {
    res.send(500);
  }
}

/**
 * Implements screen delete.
 *
 * Removes the screen form local cache (forced reload from backend).
 */
exports.screenRemove = function (req, res) {
  if (!accessCheck(req)) {
    res.send(403);
    return;
  };

  if (req.body.token !== undefined) {
    // Load the screen and remove it.
    var Screen = require('../lib/screen');
    var instance = new Screen(req.body.token);

    // Load it before removeing it to get socket connection.
    instance.load();
    instance.on('loaded', function() {
      instance.remove();
    });

    // Screen has been removed.
    instance.on('removed', function() {
      res.send(200);
    });

    // Handle errors in screen removale.
    instance.on('error', function(data) {
      // @todo send result back.
      res.send(data.code);
    });
  }
}

/**
 * Implements push channel content.
 */
exports.pushChannel = function (req, res) {
  if (!accessCheck(req)) {
    res.send(403);
    return;
  };

  if (req.body.channelID !== undefined) {
    // Create new channel object.
    var Channel = require('../lib/channel');
    var instance = new Channel(req.body.channelID);

    // Add content.
    instance.set('content', req.body.channelContent);

    // Add groups.
    instance.set('groups', req.body.groups);

    // Cache channel (save in redis).
    instance.save();
    instance.on('saved', function() {
      // Save completed.
      res.send(200);

      // Push content to screens.
      instance.push();
    });

    // Handle error events.
    instance.on('error', function(data) {
      console.log(data.code + ': ' + data.message);
      res.send(500);
    });
  }
  else {
    res.send(500);
  }
}

/**
 * Implements emergency content push.
 */
exports.pushEmergency = function (req, res) {
  if (!accessCheck(req)) {
    res.send(403);
    return;
  };

  res.send(501);
}

/**
 * Implements status request.
 */
exports.status = function (req, res) {
  if (!accessCheck(req)) {
    res.send(403);
    return;
  };

  res.send(501);
}
