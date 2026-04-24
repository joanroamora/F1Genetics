from flask import Flask, render_template, request

app = Flask(__name__)

# Route 1: The Setup / Welcome Page
@app.route('/')
def setup():
    return render_template('setup.html')

# Route 2: The Simulation Page (Receives parameters)
@app.route('/simulation', methods=['GET'])
def simulation():
    # Capturamos los datos del formulario (Query Params)
    track_id = request.args.get('track', 'monaco')
    population_size = request.args.get('population', 50)
    brain_mode = request.args.get('brain_mode', 'scratch')
    
    return render_template('index.html', 
                           track=track_id, 
                           population=population_size,
                           brain_mode=brain_mode)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)