from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import os
import openai

app = Flask(__name__)
CORS(app)

openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/ask', methods=['POST'])
def ask():
    req_data = request.get_json()
    prompt = req_data['inputText']
    start_sequence = "\nAI:"
    restart_sequence = "\nHuman: "

    response = openai.Completion.create(
        model="davinci:ft-yext-2023-02-19-06-08-58",
        prompt=prompt,
        temperature=0.9,
        max_tokens=150,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0.6,
        stop=[" Human:", " AI:"]
    )

    return make_response(jsonify(response.choices[0].text))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)



