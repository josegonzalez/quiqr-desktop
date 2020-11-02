import React from 'react';
import TextField from 'material-ui/TextField';
import service from './../services/service'

class PreviewButtons extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            previewPath: '/'
        };
    }

    setUrl(event,url){
        service.api.logToConsole(url);
        let path = url.split('1313')[1];
        if(path === ''){
            path = "/";
        }

        this.setState({previewPath: path});
    }

    xcomponentWillMount(){
        window.require('electron').ipcRenderer.on('previewButtonsShowingUrl',function(event, args){
            this.setUrl(args);
        }.bind(this));
    }
    componentWillMount(){
        window.require('electron').ipcRenderer.on('previewButtonsShowingUrl', this.setUrl.bind(this));
    }

    componentWillUnmount(){
        window.require('electron').ipcRenderer.removeListener('previewButtonsShowingUrl', this.setUrl.bind(this));
    }

    render(){
        return (<React.Fragment>
            <div style={{padding:10 }}>
                <TextField
                value={this.state.previewPath}
                errorText="previewing above path"
                errorStyle={{color:"#03DAC5"}}
                disabled={false}
                floatingLabelFixed={true}
                underlineShow={true}
                fullWidth={true}
                underlineFocusStyle={{ borderColor: "#bbb" }}
                textareaStyle={{ color:"#999" }}
                inputStyle={{ color:"#999" }}

                />

            </div>
        </React.Fragment>);
    }
}

export default PreviewButtons;
