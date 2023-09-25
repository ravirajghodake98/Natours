module.exports = fn => {
  // //there is a problem with this fn as this fn call has no way of knowing req, res & next
  // //& the 2nd problem is we are calling an async fn inside the catchAsync fn
  // fn(req, res, next).catch(err => next(err))

  return (req, res, next) => {
    fn(req, res, next).catch(next);
  }
}