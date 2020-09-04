import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ReactMapGL, { _MapContext as MapContext, StaticMap, NavigationControl, Popup} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Deck.gl
import DeckGL, { MapController, FlyToInterpolator }  from 'deck.gl';
import { IconLayer } from '@deck.gl/layers';
import { Position } from '@deck.gl/core/utils/positions';
import { PickInfo } from '@deck.gl/core/lib/deck';

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

export interface LayerEventDatum {
    lngLat: Position;
    label: string;
    layer: number;
    pk: number;
    description: string;
    datetime: string;
    location: {
        point: string;
        polygon: string;
        lng_lat: Position;
    }
}

export interface LayerEventData {
    visibility: boolean;
    events: LayerEventDatum[];
}

interface ViewportState {
    latitude: number,
    longitude: number,
    zoom: number,
    bearing: number,
    pitch: number,
    transitionDuration?: number,
    transitionInterpolator?: FlyToInterpolator,
}

export const ProjectMap = () => {
    const [viewportState, setViewportState] = useState<ViewportState>({
        latitude: 40.8075395,
        longitude: -73.9647614,
        zoom: 10,
        bearing: 0,
        pitch: 40.5
    });

    const mapContainer: any = document.querySelector('#project-map-container');
    const BASEMAP_STYLE = mapContainer.dataset.basemap;
    const TOKEN = mapContainer.dataset.maptoken;
    const pathList = window.location.pathname.split('/');
    const projectPk = pathList[pathList.length - 2];
    const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
    const [layerData, setLayerData] = useState<LayerProps[]>([]);
    const [activeLayer, setActiveLayer] = useState<number | null>(null);
    const [activeEvent, setActiveEvent] = useState<LayerEventDatum | null>(null);
    const [activeEventDetail, setActiveEventDetail] = useState<LayerEventDatum | null>(null);
    const [activeEventEdit, setActiveEventEdit] = useState<LayerEventDatum | null>(null);

    // Data structure to hold events, keyed by layer PK
    const [eventData, setEventData] =
        useState<Map<number, LayerEventData>>(new Map());
    const [mapboxLayers, setMapboxLayers] = useState<any[]>([]);

    const [layerTitleCount, setLayerTitleCount] = useState<number>(1);

    const [showAddEventForm, setShowAddEventForm] = useState<boolean>(false);
    const [activePosition, setActivePosition] = useState<Position | null>(null);

    useEffect(() => {
        let getData = async() => {
            // Fetch the Project data
            let projectResponse = await fetch(`/api/project/${projectPk}/`);
            if (!projectResponse.ok) {
                throw new Error('Project data not loaded');
            }
            let projectData = await projectResponse.json();
            setProjectInfo(projectData);

            // Fetch the layers
            let layersRsps = await Promise.all(
                projectData.layers.map((layer: string) => {
                    return fetch(layer);
                })
            );
            let layers = await Promise.all(
                layersRsps.map((response: any) => { return response.json(); })
            );

            // Create an empty layer if none exist, otherwise
            // unpack the event data
            if (layers.length === 0) {
                addLayer();
                setLayerTitleCount((prev) => {return prev + 1;});
            } else {
                setLayerData(layers);
                setActiveLayer(layers[0].pk);

                let events = layers.reduce((acc, val) => {
                    acc.set(val.pk, {visibility: true, events: val.event_set});
                    return acc;
                }, new Map());
                updateEventData(events);
            }
        };

        getData();
    }, []);

    const addLayer = () => {
        authedFetch('/api/layer/', 'POST', JSON.stringify(
            {title: `Layer ${layerTitleCount}`, content_object: `/api/project/${projectPk}/`}))
            .then((response) => {
                if (response.status === 201) {
                    return response.json();
                } else {
                    throw 'Layer creation failed.';
                }
            })
            .then((data) => {
                setLayerData([...layerData, data]);
                setActiveLayer(data.pk);
                setLayerTitleCount((prev) => {return prev + 1;});
            });
    };

    const deleteLayer = (pk: number) => {
        authedFetch(`/api/layer/${pk}/`, 'DELETE', JSON.stringify({pk: pk}))
            .then((response) => {
                if (response.status !== 204) {
                    throw 'Layer deletion failed.';
                } else {
                    let updatedLayerData = layerData.filter((el) => {
                        return el.pk !== pk;
                    });
                    setLayerData(updatedLayerData);

                    // remove from eventData and mapboxLayers
                    let updatedEventData = new Map(eventData);
                    updatedEventData.delete(pk);
                    updateEventData(updatedEventData);

                    if (updatedLayerData.length === 0) {
                        // addLayer has a stale closure, so the fetch
                        // is called here instead
                        authedFetch('/api/layer/', 'POST', JSON.stringify(
                            {title: `Layer ${layerTitleCount}`,
                                content_object: `/api/project/${projectPk}/`}))
                            .then((response) => {
                                if (response.status === 201) {
                                    return response.json();
                                } else {
                                    throw 'Layer creation failed.';
                                }
                            })
                            .then((data) => {
                                setLayerData([data]);
                                setActiveLayer(data.pk);
                                setLayerTitleCount(
                                    (prev) => {return prev + 1;});
                            });
                    }
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

    const setLayerVisibility = (pk: number) => {
        let updatedEvents = new Map(eventData);
        let layerEvents = updatedEvents.get(pk);

        if (layerEvents) {
            updatedEvents.set(pk, {
                visibility: !layerEvents.visibility,
                events: layerEvents.events
            });

            updateEventData(updatedEvents);
        }
    };

    const addEvent = (label: string, description: string, lat: number, lng: number) => {
        let data = {
            label: label,
            layer: activeLayer,
            description: '',
            datetime: null,
            location: {
                point: {lat: lat, lng: lng},
                polygon: null
            }
        };
        authedFetch('/api/event/', 'POST', JSON.stringify(data))
            .then((response) => {
                if (response.status === 201) {
                    return response.json();
                } else {
                    throw 'Event creation failed.';
                }
            })
            .then((data: LayerEventDatum) => {
                if (activeLayer) {
                    let updatedEvents = new Map(eventData);
                    let layerEvents: LayerEventData = updatedEvents.get(activeLayer) || {visibility: true, events: []};

                    updatedEvents.set(activeLayer, {
                        visibility: layerEvents.visibility,
                        events: layerEvents.events.concat(data)
                    });

                    updateEventData(updatedEvents);
                    setActiveEvent(data);
                    goToNewEvent();
                }
            });
    };

    const updateEvent = (
        label: string, description: string, lat: number, lng: number,
        pk: number, layerPk: number) => {
        let obj = {
            label: label,
            description: description,
            layer: layerPk,
            location: {
                point: {lat: lat, lng: lng},
                polygon: null
            }
        }
        authedFetch(`/api/event/${pk}/`, 'PUT', JSON.stringify(obj))
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw 'Event update failed.';
                }
            })
            .then((data: LayerEventDatum) => {
                // Revomve the event from eventData and mapboxLayers
                let updatedEventData = new Map(eventData);
                let layerEventObj = updatedEventData.get(layerPk);
                if (layerEventObj && layerEventObj.events) {
                    updatedEventData.set(layerPk, {
                        visibility: layerEventObj.visibility,
                        events: layerEventObj.events.map((el) => {
                            return el.pk !== data.pk ? el : data;
                        })
                    });
                }
                updateEventData(updatedEventData);
                // Update the data for the active event
                setActiveEventDetail(data);
                setActiveEvent(data);
            });
    };

    const deleteEvent = (pk: number, layerPk: number) => {
        authedFetch(`/api/event/${pk}/`, 'DELETE', JSON.stringify({pk: pk}))
            .then((response) => {
                if (response.status !== 204) {
                    throw 'Event deletion failed.';
                } else {
                    // Remove the event from eventData and mapboxLayers
                    let updatedEventData = new Map(eventData);
                    let layerEventObj = updatedEventData.get(layerPk);
                    if (layerEventObj && layerEventObj.events) {
                        updatedEventData.set(layerPk, {
                            visibility: layerEventObj.visibility,
                            events: layerEventObj.events.filter((el) => {
                                return el.pk !== pk; })
                        });
                    }
                    setActiveEvent(null);
                    updateEventData(updatedEventData);
                }
            });
    };

    const pickEventClickHandler = (info: PickInfo<LayerEventDatum>, evt: HammerInput) => {
        // Clear the 'Add Event Form' and 'Add Event Pin'
        setShowAddEventForm(false);
        clearActivePosition();

        // Set the active event
        setActiveEvent(info.object as LayerEventDatum);

        // Returning true prevents event from bubling to map canvas
        return true;
    };

    const updateEventData = (events: Map<number, LayerEventData>) => {
        let mapLayers = [...events.keys()].reduce(
            (acc: IconLayer<LayerEventDatum>[], val: number) => {
                let data = events.get(val);
                if (data && data.visibility) {
                    let layer = new IconLayer({
                        id: 'icon-layer-' + val,
                        data: data.events,
                        pickable: true,
                        iconAtlas: ICON_ATLAS,
                        iconMapping: ICON_MAPPING,
                        getIcon: d => 'marker',
                        sizeScale: 15,
                        getPosition: (d) => d.location.lng_lat,
                        onClick: pickEventClickHandler,
                        getSize: 5,
                        getColor: [255, 0, 0],
                    });
                    return [...acc, layer];
                } else {
                    return acc;
                }
            },
            []);

        setEventData(events);
        setMapboxLayers(mapLayers);
    };

    const ICON_ATLAS = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png';
    const ICON_MAPPING = {
        marker: {x: 0, y: 0, width: 128, height: 128, mask: true}
    };

    const handleDeckGlClick = (info: any, event: any) => {
        // Create on single click, make sure that new event
        // is not created when user intends to pick an existing event
        if (event.tapCount === 1) {
            // Clear the active event
            setActiveEvent(null);
            setShowAddEventForm(true);
            setActivePosition([info.lngLat[1], info.lngLat[0]]);
            let updatedLayers = mapboxLayers.filter((el) => {
                return el.id !== 'active-position';
            });
            updatedLayers = updatedLayers.concat(new IconLayer({
                id: 'active-position',
                data: [
                    {position: [info.lngLat[0], info.lngLat[1]] as Position}],
                pickable: true,
                iconAtlas: ICON_ATLAS,
                iconMapping: ICON_MAPPING,
                getIcon: d => 'marker',
                sizeScale: 15,
                getPosition: d => d.position,
                getSize: 5,
                getColor: [0, 0, 255],
            }));
            setMapboxLayers(updatedLayers);
        }
    };

    const clearActivePosition = () => {
        setActivePosition(null);
        setMapboxLayers((prev) => {
            return prev.filter((el) => {
                return el.id !== 'active-position';
            });
        });
    };

    const goToNewEvent = useCallback(() => {
        if (activePosition) {
            setViewportState({
                latitude: activePosition[0],
                longitude: activePosition[1],
                zoom: 12,
                bearing: 0,
                pitch: 40.5,
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator()
            });
        }
    }, [activePosition]);

    return (
        <>
            <DeckGL
                layers={mapboxLayers}
                initialViewState={viewportState}
                width={'100%'}
                height={'100%'}
                controller={{doubleClickZoom: false} as any}
                onClick={handleDeckGlClick}
                pickingRadius={15}
                ContextProvider={MapContext.Provider}>
                <StaticMap
                    reuseMaps
                    width={'100%'}
                    height={'100%'}
                    preventStyleDiffing={true}
                    mapStyle={'mapbox://styles/mapbox/' + BASEMAP_STYLE}
                    mapboxApiAccessToken={TOKEN} />
                {activeEvent && (
                    <Popup
                        latitude={activeEvent.location.lng_lat[1]}
                        longitude={activeEvent.location.lng_lat[0]}
                        closeOnClick={false}
                        onClose={() => setActiveEvent(null)}>
                        <div>{activeEvent.label}</div>
                        <div><p>{activeEvent.description}</p></div>
                        <button onClick={() => {setActiveEventDetail(activeEvent);}}>
                            More
                        </button>
                    </Popup>
                )}
                <div id='map-navigation-control'>
                    <NavigationControl />
                </div>
            </DeckGL>
            {projectInfo && (
                <ProjectMapSidebar
                    title={projectInfo.title}
                    description={projectInfo.description}
                    layers={layerData}
                    events={eventData}
                    activeLayer={activeLayer}
                    setActiveLayer={setActiveLayer}
                    addLayer={addLayer}
                    deleteLayer={deleteLayer}
                    updateLayer={updateLayer}
                    setLayerVisibility={setLayerVisibility}
                    showAddEventForm={showAddEventForm}
                    setShowAddEventForm={setShowAddEventForm}
                    activePosition={activePosition}
                    clearActivePosition={clearActivePosition}
                    activeEvent={activeEvent}
                    setActiveEvent={setActiveEvent}
                    activeEventDetail={activeEventDetail}
                    setActiveEventDetail={setActiveEventDetail}
                    activeEventEdit={activeEventEdit}
                    setActiveEventEdit={setActiveEventEdit}
                    addEvent={addEvent}
                    deleteEvent={deleteEvent}
                    updateEvent={updateEvent}/>
            )}
        </>
    );
};
