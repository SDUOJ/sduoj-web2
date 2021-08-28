import React from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import MLayout from "./Component/common/MLayout";

function App() {
    return (
        <>
            <MLayout id={0} roles={[0]}/>
        </>
    );
}

export default App;
