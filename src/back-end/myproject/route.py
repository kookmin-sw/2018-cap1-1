from flask import Flask, render_template, request
app = Flask(__name__)

@app.route("/")
def home():
  return render_template('home.html')

@app.route('/about')
def about():
  return render_template('about.html')

@app.route('/profile/<username>')
def get_profile(username):
  return 'profile: ' + username

"""
@app.route('/profile/', methods=['POST','GET'])
def profile(username=None)
    error = None
    if request.method == 'POST':
        username = request.form['username']
	email = request.form['email']
	if not username and not email:
	    return add_profile(request.form)
    else:
	error = 'Invalid username or email'
    return render_template('profile.html', error = error)
"""

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
    


