//@flow

import React from 'react';
import service from './../services/service'
import { snackMessageService } from './../services/ui-service'
// import { Redirect } from 'react-router-dom'
import { SukohForm } from './../components/SukohForm';
import Spinner from './../components/Spinner'
// import { FormBreadcumb } from './../components/Breadcumb'

import type { WorkspaceConfig } from './../types';

type CollectionItemProps = {
    siteKey: string,
    workspaceKey: string,
    collectionKey: string,
    collectionItemKey: string
}

type CollectionItemState = {
    selectedWorkspaceDetails: ?WorkspaceConfig,
    collectionItemValues: any
}

class CollectionItem extends React.Component<CollectionItemProps,CollectionItemState>{
    constructor(props : CollectionItemProps){
        super(props);
        this.state = {
            selectedWorkspaceDetails: null,
            collectionItemValues: null
        };
    }

    componentWillMount(){
        service.registerListener(this);
    }

    componentWillUnmount(){
        service.unregisterListener(this);
    }

    componentDidMount(){
        var stateUpdate  = {};
        var { siteKey, workspaceKey, collectionKey, collectionItemKey } = this.props;

        Promise.all([
            service.api.getWorkspaceDetails(siteKey, workspaceKey).then((workspaceDetails)=>{
                stateUpdate.selectedWorkspaceDetails = workspaceDetails;
            }),
            service.api.getCollectionItem(siteKey, workspaceKey, collectionKey, collectionItemKey).then((collectionItemValues)=>{
                stateUpdate.collectionItemValues = collectionItemValues;
            })
        ]).then(()=>{
            this.setState(stateUpdate);

        });

    }

    handleSave(context: any){
        let { siteKey, workspaceKey, collectionKey, collectionItemKey } = this.props;

        let promise = service.api.updateCollectionItem(siteKey, workspaceKey, collectionKey, collectionItemKey, context.data);
        promise.then(function(updatedValues){
            snackMessageService.addSnackMessage("Document saved successfully.")
            context.accept(updatedValues);
        }, function(){
            context.reject('Something went wrong.');
        })
    }

    generatePageUrl(collection){

        let ItemPathElements = this.props.collectionItemKey.split("/");
        let pageItem = ItemPathElements.pop();
        if(pageItem !='index.md'){
            ItemPathElements.push(pageItem.split('.').slice(0, -1).join('.'));
        }

        let CollectionPath = collection.folder.split("/")
        CollectionPath.shift();

        let path = CollectionPath.join("/")+ItemPathElements.join("/");
        let url = 'http://localhost:1313/'+path.toLowerCase();

        return url;
    }


    render(){
        if(this.state.collectionItemValues===undefined||this.state.selectedWorkspaceDetails==null){
            return <Spinner />;
        }

        // let { selectedWorkspaceDetails, collectionItemValues } = this.state;
        let { selectedWorkspaceDetails} = this.state;
        let { siteKey, workspaceKey, collectionKey, collectionItemKey } = this.props;

        let collection = selectedWorkspaceDetails.collections.find(x => x.key === collectionKey);
        if(collection==null)return null;

        let fields = collection.fields.slice(0);
        //fields.unshift({key:'__item', type:'readonly', title:'Item'});
        //let values =  Object.assign({__item: collectionItemKey}, this.state.collectionItemValues)
        let values =  Object.assign(this.state.collectionItemValues)

        let pageUrl = this.generatePageUrl(collection);
        service.api.updateMobilePreviewUrl(pageUrl)

        return(<SukohForm
            debug={false}
            rootName={collection.title}
            pageUrl={pageUrl}
            fields={fields}
            siteKey={siteKey}
            workspaceKey={workspaceKey}
            collectionKey={collectionKey}
            collectionItemKey={collectionItemKey}
            values={values}
            trim={false}
            plugins={{
                openBundleFileDialog: function({title, extensions, targetPath}, onFilesReady){
                    return service.api.openFileDialogForCollectionItem(siteKey,workspaceKey,collectionKey,collectionItemKey, targetPath, {title, extensions});
                },
                getBundleThumbnailSrc: function(targetPath){
                    return service.api.getThumbnailForCollectionItemImage(siteKey,workspaceKey,collectionKey,collectionItemKey, targetPath);
                }
            }}
            onSave={this.handleSave.bind(this)}
        />);
    }
}

export default CollectionItem;
