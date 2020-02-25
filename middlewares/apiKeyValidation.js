
function validationMiddleware (req, res, next) {
  const reqKey = req.get('API_KEY')
  const apiKey = process.env.API_KEY
  if (reqKey !== apiKey){
    return res.sendStatus(401);
  }
  next()
}

module.exports = validationMiddleware;
