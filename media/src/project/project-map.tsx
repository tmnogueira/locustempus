import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactMapGL, { _MapContext as MapContext, StaticMap, InteractiveMap, NavigationControl} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Deck.gl
import DeckGL, { MapController }  from 'deck.gl';
import { IconLayer } from '@deck.gl/layers';
import { Position } from '@deck.gl/core/utils/positions';

import {
    ProjectMapSidebar, ProjectMapSidebarProps } from './project-map-sidebar';
import { LayerProps } from './layer';

const authedFetch = (url: string, method: string, data: any) => {
    let csrf = (document.getElementById('csrf-token') as any).getAttribute('content');
    return fetch(url,{
        method: method,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf
        },
        body: data,
        credentials: 'same-origin'
    });
};

interface ProjectInfo {
    title: string;
    description: string;
    base_map: string;
    layers: LayerProps[];
}

interface LayerEventDatum {
    lngLat: Position;
}

interface LayerEventData {
    [index: string]: LayerEventDatum[]
}

export const ProjectMap = () => {
    const viewportState = {
        viewport: {
            latitude: 40.8075395,
            longitude: -73.9647614,
            zoom: 10,
            bearing: 0,
            pitch: 40.5
        }
    };

    const mapContainer: any = document.querySelector('#project-map-container');
    const BASEMAP_STYLE = mapContainer.dataset.basemap;
    const TOKEN = mapContainer.dataset.maptoken;
    const pathList = window.location.pathname.split('/');
    const projectPk = pathList[pathList.length - 2];
    const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
    const [layerData, setLayerData] = useState<LayerProps[]>([]);
    const [activeLayer, setActiveLayer] = useState<number | null>(null);

    // Data structure to hold event data, keyed by event PK
    // { int: [{lngLat: []},... ], ...}
    const [layerEventMapData, setLayerEventMapData] =
        useState<LayerEventData | null>(null);
    const [mapboxLayers, setMapboxLayers] = useState<any[]>([]);


    useEffect(() => {
        let getData = async() => {
            let projectResponse = await fetch(`/api/project/${projectPk}/`);
            if (!projectResponse.ok) {
                throw new Error('Project data not loaded');
            }
            let projectData = await projectResponse.json();
            setProjectInfo(projectData);

            let layersRsps = await Promise.all(
                projectData.layers.map((layer: string) => {
                    return fetch(layer);
                })
            );
            let layers = await Promise.all(
                layersRsps.map((response: any) => { return response.json(); })
            );
            setLayerData(layers);
        };

        getData();
    }, []);

    const addLayer = (title: string) => {
        authedFetch('/api/layer/', 'POST', JSON.stringify(
            {title: title, content_object: `/api/project/${projectPk}/`}))
            .then((response) => {
                if (response.status === 201) {
                    return response.json();
                } else {
                    throw 'Layer creation failed.';
                }
            })
            .then((data) => {
                setLayerData([...layerData, data]);
            });
    };

    const deleteLayer = (pk: number) => {
        authedFetch(`/api/layer/${pk}/`, 'DELETE', JSON.stringify({pk: pk}))
            .then((response) => {
                if (response.status !== 204) {
                    throw 'Layer deletion failed.';
                } else {
                    setLayerData(layerData.filter((el) => {
                        return el.pk !== pk;
                    }));
                }
            });
    };

    const updateLayer = (pk: number, title: string) => {
        authedFetch(`/api/layer/${pk}/`, 'PUT', JSON.stringify(
            {title: title, content_object: `/api/project/${projectPk}/`}))
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw 'Layer update failed.';
                }
            })
            .then((data) => {
                let layer = layerData.filter((el) => {
                    return el.pk !== pk;
                });
                setLayerData([...layer, data]);
            });
    };

    const ICON_ATLAS = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png';
    const ICON_MAPPING = {
        marker: {x: 0, y: 0, width: 128, height: 128, mask: true}
    };

    const handleDeckGlClick = (info: any, event: any) => {
        if (event.tapCount === 2) {
            // Add event
            // Update the mapboxLayers prop
            // For now this means updating an event data list,
            // create a new IconLayer, and update mapboxLayers with
            // this new Iconlayer
            if (activeLayer) {
                let updatedLayerEvents =
                    layerEventMapData ? layerEventMapData : {activeLayer: []};

                updatedLayerEvents[activeLayer] = [
                    ...updatedLayerEvents[activeLayer],
                    {lngLat: info.lngLat}
                ];

                let layers = Object.keys(updatedLayerEvents).reduce(
                    (acc: any[], val: string) => {
                        let layer = new IconLayer({
                            id: 'icon-layer-' + val,
                            data: updatedLayerEvents[val],
                            pickable: true,
                            iconAtlas: ICON_ATLAS,
                            iconMapping: ICON_MAPPING,
                            getIcon: d => 'marker',
                            sizeScale: 15,
                            getPosition: (d: LayerEventDatum) => d.lngLat ,
                            getSize: 5,
                            getColor: [255, 0, 0],
                        });
                        return [...acc, layer];
                    },
                    []);

                setLayerEventMapData(updatedLayerEvents);
                setMapboxLayers(layers);
            }
        }
    };

    return (
        <>
            <DeckGL
                layers={mapboxLayers}
                initialViewState={viewportState.viewport}
                width={'100%'}
                height={'100%'}
                controller={{
                    type: MapController, doubleClickZoom: false} as any}
                onClick={handleDeckGlClick}
                ContextProvider={MapContext.Provider}>
                <StaticMap
                    reuseMaps
                    width={'100%'}
                    height={'100%'}
                    preventStyleDiffing={true}
                    mapStyle={'mapbox://styles/mapbox/' + BASEMAP_STYLE}
                    mapboxApiAccessToken={TOKEN} />
                <div id='map-navigation-control'>
                    <NavigationControl />
                </div>
            </DeckGL>
            {projectInfo && (
                <ProjectMapSidebar
                    title={projectInfo.title}
                    description={projectInfo.description}
                    layers={layerData}
                    activeLayer={activeLayer}
                    setActiveLayer={setActiveLayer}
                    addLayer={addLayer}
                    deleteLayer={deleteLayer}
                    updateLayer={updateLayer}/>
            )}
        </>
    );
};
