var nodemailer = require('nodemailer')
var Markdown   = require('markdown').markdown
var util       = require('util')
var Macros     = require('./config/models/macros')

exports.mail_community = function(new_event) {
  // create reusable transport method (opens pool of SMTP connections)
  var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.mail_user,
      pass: process.env.mail_pass
    }
  })

  mail_from = 'ROSEdu Events <contact@rosedu.org>'
  mail_to = 'rosedu-general@lists.rosedu.org'

  // Compose mail
  message = Markdown.toHTML(new_event.description) + '____________________<br>'
  message += new_event.date + ', ' + new_event.location

  var mailOpt = {
    'from':    mail_from,
    'to':      mail_to,
    'subject': new_event.name,
    'html':    message
  }

  // send mail with defined transport object
  smtpTransport.sendMail(mailOpt, function(err, response){
    if (err) console.log(err)
    else console.log("* Email sent to the community")

    smtpTransport.close();
  })
}

// Date object to DD MM YYYY HH:MM string
exports.getFormattedDateTime = function(date) {
  return util.format('%d %s %d %s:%s',
    date.getDate(),
    Macros.months[date.getMonth()],
    date.getFullYear(),
    ('0' + date.getHours()).slice(-2),
    ('0' + date.getMinutes()).slice(-2)
  )
}

// Date object to DD/MM/YYYY HH:MM string
exports.getFormattedDateTimeForEdit = function(date) {
  return util.format('%d/%d/%d %s:%s',
    ('0' + (date.getMonth() + 1)).slice(-2),
    date.getDate(),
    date.getFullYear(),
    date.getHours(),
    date.getMinutes()
  )
}

// Date object to DD/MM/YYYY string
exports.getFormattedDateForEdit = function(date) {
  return util.format('%s/%s/%s',
    ('0' + date.getDate()).slice(-2),
    ('0' + (date.getMonth() + 1)).slice(-2),
    date.getFullYear()
  )
}

// DD/MM/YYYY to Date object
exports.setFormattedDateForEdit = function(datestr) {
  return new Date(
    datestr.substring(6,10),
    parseInt(datestr.substring(3,5)) - 1,
    datestr.substring(0,2)
  )
}



