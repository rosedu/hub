var nodemailer = require('nodemailer')
var Markdown = require('markdown').markdown

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