function signInCallback(authResult) {
  if (authResult.code && authResult['g-oauth-window'] && authResult.status.method == 'PROMPT') {
    $.post('/auth/google/callback', {code: authResult.code})
    .done(function(data) {
      $('#signinButton').hide()
      window.location.replace(data)
    });
  } else if (authResult.error) {
    console.log('There was an error: ' + authResult.error);
  }
}