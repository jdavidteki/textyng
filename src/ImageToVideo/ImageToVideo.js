import React, { Component } from 'react';

class ImageToVideo extends Component {
  state = {
    file: null,
    result: null,
    loading: false,
    error: null
  }

  handleFileChange = (event) => {
    this.setState({ file: event.target.files[0] });
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('file', this.state.file);

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch('https://h4xfmwkmb1.execute-api.us-east-1.amazonaws.com/default/imaigin', {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();

      this.setState({ result, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  render() {
    const { file, result, loading, error } = this.state;

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <input type="file" accept="image/*" onChange={this.handleFileChange} />
          <button type="submit" disabled={!file || loading}>Submit</button>
        </form>

        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {result && (
          <div>
            <h3>Result:</h3>
            <video src={result} controls />
          </div>
        )}
      </div>
    );
  }
}

export default ImageToVideo;
