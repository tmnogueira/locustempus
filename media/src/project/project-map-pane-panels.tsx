import React, { useState, useEffect } from 'react';
import { Layer, LayerProps } from './layer';
import { LayerEventData, LayerEventDatum, BASE_MAPS } from './project-map';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLayerGroup, faArrowLeft, faEllipsisV, faAngleRight, faAngleDown
} from '@fortawesome/free-solid-svg-icons';
import { Position } from '@deck.gl/core/utils/positions';
import ReactQuill from 'react-quill';


interface ProjectCreateEditPanelProps {
    isNewProject: boolean;
    setIsNewProject(val: boolean): void;
    projectTitle: string;
    projectDescription: string;
    projectBaseMap: string;
    setBaseMap(baseMap: string): void;
    updateProject(title: string, description: string, baseMap: string): void;
    showDefaultMenu(): void;
    deleteProject(): void;
}

export const ProjectCreateEditPanel: React.FC<ProjectCreateEditPanelProps> = (
    {
        isNewProject, setIsNewProject, projectTitle, projectDescription,
        projectBaseMap, setBaseMap, updateProject, showDefaultMenu,
        deleteProject
    }: ProjectCreateEditPanelProps) => {

    const [title, setTitle] = useState<string>(projectTitle);
    const [description, setDescription] = useState<string>(projectDescription);
    const [showBaseMapMenu, setShowBaseMapMenu] = useState<boolean>(false);

    useEffect(() => {
        setTitle(projectTitle);
        setDescription(projectDescription);
    }, [projectTitle, projectDescription]);

    const handleTitle = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setTitle(e.target.value);
    };

    const handleBaseMap = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setBaseMap(e.target.value);
    };

    const toggleBaseMapMenu = (e: React.MouseEvent): void => {
        e.preventDefault();
        setShowBaseMapMenu((prev) => {return !prev;});
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        updateProject(title, description, projectBaseMap);
        setIsNewProject(false);
        showDefaultMenu();
    };

    const handleCancel = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        showDefaultMenu();
    };

    const handleNewProjectCancel = (
        e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        deleteProject();
    };

    return (
        <div>
            <h4>{isNewProject ? 'Create Project' : 'Edit Project'}</h4>
            <form onSubmit={handleFormSubmit} >
                <div className={'form-group'}>
                    <label htmlFor={'event-form__name'}>Title</label>
                    <input
                        type={'text'}
                        id={'event-form__name'}
                        className={'form-control'}
                        value={title}
                        autoFocus={true}
                        onChange={handleTitle}/>
                </div>
                <div className="form-group">
                    <label htmlFor={'event-form__description'}>
                        Description
                    </label>
                    <ReactQuill
                        value={description}
                        onChange={setDescription}/>
                </div>
                { showBaseMapMenu ? (
                    <div>
                        <div onClick={toggleBaseMapMenu}>
                            <FontAwesomeIcon icon={faAngleDown}/>
                                Base Map: {BASE_MAPS.get(projectBaseMap)}
                        </div>
                        <fieldset className="form-group">
                            <div className="row">
                                <div className="col">
                                    {[...BASE_MAPS.keys()].map((val, idx) => {
                                        return (
                                            <div className="form-check"
                                                key={idx}>
                                                <input
                                                    className={
                                                        'form-check-input'}
                                                    type={'radio'}
                                                    id={'base-map-' + idx}
                                                    value={val}
                                                    onChange={handleBaseMap}
                                                    checked={
                                                        val === projectBaseMap}
                                                />
                                                <label
                                                    htmlFor={'base-map-' + idx}>
                                                    {BASE_MAPS.get(val)}
                                                </label>
                                            </div>
                                        );})
                                    }
                                </div>
                            </div>
                        </fieldset>
                    </div>
                ) : (
                    <div onClick={toggleBaseMapMenu}>
                        <div>
                            <FontAwesomeIcon
                                icon={faAngleRight}/> Base Map: {projectBaseMap}
                        </div>
                    </div>
                ) }
                <div className="form-row">
                    <div className={'form-group col-3'}>
                    </div>
                    <div className={'form-group col-9'}>
                        {isNewProject ? (
                            <>
                                <button
                                    type={'button'}
                                    onClick={handleNewProjectCancel}
                                    className={'btn btn-danger'}>
                                    Cancel
                                </button>
                                <button
                                    type={'submit'}
                                    className={'btn btn-primary'}>
                                    Create project
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type={'button'}
                                    onClick={handleCancel}
                                    className={'btn btn-danger'}>
                                    Cancel
                                </button>
                                <button
                                    type={'submit'}
                                    className={'btn btn-primary'}>
                                    Save
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};


interface EventEditPanelProps {
    activeLayer: number | null;
    activeEventEdit: LayerEventDatum;
    setActiveEventEdit(d: LayerEventDatum | null): void;
    updateEvent(label: string, description: string,
                lat: number, lng: number, pk: number, layerPk: number): void;
}

export const EventEditPanel: React.FC<EventEditPanelProps> = (
    {
        activeEventEdit, setActiveEventEdit, updateEvent
    }: EventEditPanelProps) => {

    const [
        eventName, setEventName] = useState<string>(activeEventEdit.label);
    const [
        description, setDescription
    ] = useState<string>(activeEventEdit.description);
    const [
        datetime, setDatetime
    ] = useState<string>(activeEventEdit.datetime || '');

    const handleName = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEventName(e.target.value);
    };

    const handleDatetime = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setDatetime(e.target.value);
    };

    const handleFormSubmbit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        updateEvent(
            eventName, description, activeEventEdit.location.lng_lat[1],
            activeEventEdit.location.lng_lat[0],
            activeEventEdit.pk, activeEventEdit.layer);
        setActiveEventEdit(null);
    };

    const handleCancel = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        setActiveEventEdit(null);
    };

    return (
        <div>
            <h4>Edit Event</h4>
            <form onSubmit={handleFormSubmbit} >
                <div className={'form-row'}>
                    <div className={'form-group col-3'}>
                        <label htmlFor={'event-form__name'}>Name</label>
                    </div>
                    <div className={'form-group col-9'}>
                        <input
                            type={'text'}
                            id={'event-form__name'}
                            value={eventName}
                            autoFocus={true}
                            onChange={handleName}/>
                    </div>
                </div>
                <div className="form-row">
                    <div className={'form-group col-3'}>
                        <label htmlFor={'event-form__description'}>
                            Description
                        </label>
                    </div>
                    <div className={'form-group col-9'}>
                        <ReactQuill
                            value={description}
                            onChange={setDescription}/>
                    </div>
                </div>
                <div className="form-row">
                    <div className={'form-group col-3'}>
                        <label htmlFor={'event-form__date'}>
                            Date
                        </label>
                    </div>
                    <div className={'form-group col-9'}>
                        <input
                            type={'datetime-local'}
                            id={'event-form__date'}
                            value={datetime}
                            onChange={handleDatetime}/>
                    </div>
                </div>
                <div className="form-row">
                    <div className={'form-group col-3'}>
                    </div>
                    <div className={'form-group col-9'}>
                        <button
                            type={'button'}
                            onClick={handleCancel} className={'btn btn-danger'}>
                            Cancel
                        </button>
                        <button type={'submit'} className={'btn btn-primary'}>
                            Save
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};


interface EventAddPanelProps {
    showAddEventForm: boolean;
    setShowAddEventForm(val: boolean): void;
    activePosition: Position | null;
    addEvent(
        label: string, description: string, lat: number, lng: number): void;
    clearActivePosition(): void;
    setActiveTab(val: number): void;
}

export const EventAddPanel: React.FC<EventAddPanelProps> = (
    { setShowAddEventForm, activePosition, addEvent,
        clearActivePosition, setActiveTab}: EventAddPanelProps) => {

    const [eventName, setEventName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [datetime, setDatetime] = useState<string>('');

    const handleName = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEventName(e.target.value);
    };

    const handleDatetime = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setDatetime(e.target.value);
    };

    const handleFormSubmbit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (activePosition) {
            addEvent(
                eventName === '' ? 'Untitled Marker' : eventName,
                description, activePosition[0], activePosition[1]);
            setShowAddEventForm(false);
            setActiveTab(1);
            clearActivePosition();
        }
    };

    const handleCancel = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        setShowAddEventForm(false);
        clearActivePosition();
    };

    return (
        <div>
            <h4>Add Event</h4>
            <form onSubmit={handleFormSubmbit} >
                <div className={'form-row'}>
                    <div className={'form-group col-3'}>
                        <label htmlFor={'event-form__name'}>Name</label>
                    </div>
                    <div className={'form-group col-9'}>
                        <input
                            type={'text'}
                            id={'event-form__name'}
                            value={eventName}
                            autoFocus={true}
                            placeholder={'Untitled Marker'}
                            onChange={handleName}/>
                    </div>
                </div>
                <div className="form-row">
                    <div className={'form-group col-3'}>
                        <label htmlFor={'event-form__description'}>
                            Description
                        </label>
                    </div>
                    <div className={'form-group col-9'}>
                        <ReactQuill
                            value={description}
                            onChange={setDescription}/>
                    </div>
                </div>
                <div className="form-row">
                    <div className={'form-group col-3'}>
                        <label htmlFor={'event-form__date'}>
                            Date
                        </label>
                    </div>
                    <div className={'form-group col-9'}>
                        <input
                            type={'datetime-local'}
                            id={'event-form__date'}
                            value={datetime}
                            onChange={handleDatetime}/>
                    </div>
                </div>
                <div className="form-row">
                    <div className={'form-group col-3'}>
                    </div>
                    <div className={'form-group col-9'}>
                        <button
                            type={'button'}
                            onClick={handleCancel} className={'btn btn-danger'}>
                            Cancel
                        </button>
                        <button type={'submit'} className={'btn btn-primary'}>
                            Save
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

interface EventDetailPanelProps {
    activeLayer: number | null;
    activeEventDetail: LayerEventDatum | null;
    setActiveEventDetail(d: LayerEventDatum | null): void;
    activeEventEdit: LayerEventDatum | null;
    setActiveEventEdit(d: LayerEventDatum | null): void;
    deleteEvent(pk: number, layerPk: number): void;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = (
    {
        activeLayer, activeEventDetail, setActiveEventDetail,
        setActiveEventEdit, deleteEvent
    }: EventDetailPanelProps) => {
    const [showMenu, setShowMenu] = useState<boolean>(false);

    const handleBack = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        setActiveEventDetail(null);
    };

    const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        setShowMenu((prev) => {return !prev;});
    };

    const handleDelete = (e: React.MouseEvent): void => {
        e.preventDefault();
        if (activeEventDetail && activeLayer) {
            deleteEvent(activeEventDetail.pk, activeLayer);
            setActiveEventDetail(null);
        }
    };

    const handleEdit = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        setActiveEventEdit(activeEventDetail);
    };

    return (
        <div>
            <div>
                <button onClick={handleBack}>
                    <FontAwesomeIcon icon={faArrowLeft}/> Back
                </button>
                <button onClick={handleMenuToggle}>
                    <FontAwesomeIcon icon={faEllipsisV}/>
                </button>
            </div>
            {showMenu && (
                <div>
                    <ul>
                        <li><a onClick={handleEdit}>
                            Edit marker</a>
                        </li>
                        {/* TODO: Implement confirmation */}
                        <li><a onClick={handleDelete}>Delete marker</a></li>
                    </ul>
                </div>
            )}
            <h3>{activeEventDetail && activeEventDetail.label}</h3>
            {activeEventDetail && (
                <div dangerouslySetInnerHTML={
                    {__html: activeEventDetail.description}}/>
            )}
        </div>
    );
};

interface DefaultPanelProps {
    activeTab: number;
    setActiveTab(idx: number): void;
    addLayer(): void;
    description: string;
    layers: LayerProps[];
    events: Map<number, LayerEventData>;
    deleteLayer(pk: number): void;
    updateLayer(pk: number, title: string): void;
    setLayerVisibility(pk: number): void;
    activeLayer: number | null;
    setActiveLayer(pk: number): void;
    activeEvent: LayerEventDatum | null;
    setActiveEvent(d: LayerEventDatum): void;
    activeEventDetail: LayerEventDatum | null;
    setActiveEventDetail(d: LayerEventDatum): void;
    activeEventEdit: LayerEventDatum | null;
    setActiveEventEdit(d: LayerEventDatum): void;
}

export const DefaultPanel: React.FC<DefaultPanelProps> = (
    {
        activeTab, setActiveTab, addLayer, description, layers, events,
        deleteLayer, updateLayer, setLayerVisibility, activeLayer,
        setActiveLayer, activeEvent, setActiveEvent,
        setActiveEventDetail, activeEventEdit
    }: DefaultPanelProps) => {

    const handleSetActiveTab = (
        e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        setActiveTab(Number(e.currentTarget.dataset.activeTab));
    };

    const handleCreateLayer = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        addLayer();
    };

    return (
        <>
            <div>
                <ul className="nav nav-tabs">
                    {['Overview', 'Base'].map((el, idx) => {
                        return (
                            <li className="nav-item" key={idx}>
                                <a className={activeTab == idx ?
                                    'nav-link active' : 'nav-link'}
                                href='#'
                                data-active-tab={idx}
                                onClick={handleSetActiveTab}>{el}</a>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {activeTab === 0 && (
                <div dangerouslySetInnerHTML={{__html: description}}/>
            )}
            {activeTab === 1 && (
                <>
                    <form onSubmit={handleCreateLayer}>
                        <button type='submit'>
                            <FontAwesomeIcon icon={faLayerGroup}/>Add Layer
                        </button>
                    </form>
                    {layers && layers.map(
                        (layer, idx) => {
                            let layerEvents: LayerEventDatum[] = [];
                            const data = events.get(layer.pk);
                            if (data && data.events) {
                                layerEvents = data.events;
                            }

                            let layerVisibility = true;
                            if (data && data.visibility) {
                                layerVisibility = data.visibility;
                            }

                            return (
                                <Layer {...layer}
                                    deleteLayer={deleteLayer}
                                    updateLayer={updateLayer}
                                    key={idx}
                                    activeLayer={activeLayer}
                                    setActiveLayer={setActiveLayer}
                                    layerEvents={layerEvents}
                                    layerVisibility={layerVisibility}
                                    setLayerVisibility={setLayerVisibility}
                                    activeEvent={activeEvent}
                                    setActiveEvent={setActiveEvent}
                                    setActiveEventDetail={setActiveEventDetail}
                                    activeEventEdit={activeEventEdit}/>
                            );
                        })}
                </>
            )}
        </>
    );
};
