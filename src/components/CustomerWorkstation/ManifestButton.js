import React from 'react';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import './ManifestButton.css';

const ManifestButton = ({ isValidating, onManifest, onSaveState, onBack }) => {
  return (
    <div className="ManifestButton">
      {isValidating ? (
        <CircularProgress />
      ) : (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={onManifest}
            className="ManifestButton--action"
          >
            Manifest
          </Button>
          <Button
            variant="outlined"
            onClick={onSaveState}
            className="ManifestButton--action"
          >
            Save State
          </Button>
        </>
      )}
    </div>
  );
};

export default ManifestButton;