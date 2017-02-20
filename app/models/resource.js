var resource = require('resource-router-middleware');
var _        = require('lodash');
/** Creates a callback that proxies node callback style arguments to an Express Response object.
 *  @param {express.Response} res Express HTTP Response
 *  @param {number} [status=200]  Status code to send on success
 *
 *  @example
 *    list(req, res) {
 *      collection.find({}, toRes(res));
 *    }
 */
function toRes(res, status=200) {
  return (err, thing) => {
    if (err) return res.status(500).send(err);

    if (thing && typeof thing.toObject==='function') {
      thing = thing.toObject();
    }
    res.status(status).json(thing);
  };
}

function prepareData(model, data) {
  for(var prop in model.schema.paths) {
    if(model.schema.paths[prop].constructor.name == 'SchemaArray') {
      data[prop] = _.map(data[prop].split(','), _.trim);
    }
  }
  return data;
}

module.exports = function(name, model) {
  return resource({
    id : name,

    list({ params }, res) {
      
      var limit = Math.max(1, Math.min(50, params.limit|0 || 10000));

      // if you have fulltext search enabled.
      if (params.search && typeof model.textSearch==='function') {
        return model.textSearch(params.search, {
          limit : limit,
          language : 'en',
          lean : true
        }, toRes(res));
      }

      model.find({}).skip(params.start|0 || 0).limit(limit).exec(toRes(res));
    },

    create({ body }, res) {
      var data = prepareData(model, body);
      model.create(data, toRes(res));
    },

    read({ params }, res) {
      model.findById(params[name], toRes(res));
    },

    update({ body, params }, res) {
      model.findById(params[name], function(err, thing){
        if (err) return res.status(500).send(err);
        var data = prepareData(model, body);
        updatedThing = _.merge(thing, data);
        delete updatedThing._id;
        model.findOneAndUpdate( { _id: params[name] } , { $set:updatedThing }, toRes(res));
      });
    },

    delete({ params }, res) {
      model.findOneAndRemove({ _id: params[name] }, toRes(res));
    }
  });
}
