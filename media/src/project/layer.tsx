import React, { useState } from 'react';
import { LayerEventDatum } from './project-map';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye, faEyeSlash, faAngleDown, faAngleRight, faEllipsisV, faMapMarker
} from '@fortawesome/free-solid-svg-icons';

export interface LayerProps {
    title: string;
    pk: number;
    activeLayer: number | null;
    layerEvents: LayerEventDatum[];
    setActiveLayer(pk: number): void;
    deleteLayer(pk: number): void;
    updateLayer(pk: number, title: string): void;
    layerVisibility: boolean;
    setLayerVisibility(pk: number): void;
    activeEvent: LayerEventDatum | null;
    setActiveEvent(d: LayerEventDatum): void;
    setActiveEventDetail(d: LayerEventDatum | null): void;
    activeEventEdit: LayerEventDatum | null;
}

export const Layer: React.FC<LayerProps> = (
    {title, pk, activeLayer, layerEvents, setActiveLayer,
        deleteLayer, updateLayer, layerVisibility, setLayerVisibility,
        activeEvent, setActiveEvent, setActiveEventDetail
    }: LayerProps) => {
    const [updatedLayerTitle, setUpdatedLayerTitle] = useState<string>(title);
    const [openLayerMenu, setOpenLayerMenu] = useState<boolean>(false);
    const [isLayerCollapsed, setIsLayerCollapsed] = useState<boolean>(false);

    const handleUpdatedLayerTitle = (
        e: React.ChangeEvent<HTMLInputElement>): void => {
        setUpdatedLayerTitle(e.target.value);
    };

    const handleUpdateLayer = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        updateLayer(pk, updatedLayerTitle);
    };

    const handleDeleteLayer = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        deleteLayer(pk);
    };

    const handleSetActiveLayer = (): void => {
        setActiveLayer(pk);
    };

    const isActiveLayer = pk == activeLayer;

    const handleLayerMenu = (): void => {
        setOpenLayerMenu((prev) => { return !prev;});
    };

    const handleLayerCollapse = (): void => {
        setIsLayerCollapsed((prev) => { return !prev;});
    };

    const handleLayerVisibility = (): void => {
        setLayerVisibility(pk);
    };

    return (
        <div
            className={'lt-list-group ' +
                (isActiveLayer ? 'lt-list-group--active' : '')}
            style={{ border: '1px solid #ccc' }}
            onClick={handleSetActiveLayer}>
            <div className={'lt-list-group__header'}>
                {/* Layer title */}
                <h2 className="lt-list-group__title order-2">{title}</h2>
                {/* Layer show-hide and expand-collapse */}
                <div className="lt-list-group__action leading order-1">
                    <button
                        onClick={handleLayerVisibility}
                        className={'lt-icon-button lt-icon-button--transparent'}
                        aria-label={layerVisibility ? 'Hide layer' : 'Show layer'}>
                        <span className={'lt-icons lt-icon-button__icon'}
                            aria-hidden='true'>
                            <FontAwesomeIcon
                                icon={layerVisibility ? faEye : faEyeSlash}/>
                        </span>
                    </button>
                    <button
                        onClick={handleLayerCollapse}
                        className={'lt-icon-button lt-icon-button--transparent'}
                        aria-label={isLayerCollapsed ? 'Expand layer' : 'Collapse layer'}>
                        <span className={'lt-icons lt-icon-button__icon'}
                            aria-hidden='true'>
                            <FontAwesomeIcon
                                icon={isLayerCollapsed ? faAngleRight : faAngleDown}/>
                        </span>
                    </button>
                </div>
                <button onClick={handleLayerMenu}
                    className={'lt-icon-button lt-icon-button--transparent trailing order-3'}
                    aria-label='More actions'>
                    <span
                        className={'lt-icons lt-icon-button__icon'}
                        aria-hidden='true'>
                        <FontAwesomeIcon icon={faEllipsisV}/>
                    </span>
                </button>
            </div>
            { openLayerMenu && (
                <div id={'sidebar-layer-infobar__menu'}>
                    <form onSubmit={handleUpdateLayer}>
                        <label>Layer Title:
                            <input id={`update-layer-title-${pk}`}
                                value={updatedLayerTitle}
                                onChange={handleUpdatedLayerTitle}
                                className="form-control" type="text"/>
                        </label>
                        <input type='submit'
                            className='btn btn-primary' value={'Edit Layer'}/>
                    </form>
                    <form onSubmit={handleDeleteLayer}>
                        <input type='submit'
                            className='btn btn-danger' value={'Delete Layer'}/>
                    </form>
                </div>
            ) }
            { !isLayerCollapsed && (
                <ul className={'lt-list lt-list-layer'}>
                    {layerEvents.map((val, idx) => {
                        return (
                            <li key={idx}
                                className={'lt-list-item lt-list-layer-item' +
                                    (activeEvent && activeEvent.pk === val.pk ?
                                        ' lt-list-layer-item--active' : '')}>
                                <div className={'lt-list-item__link'}
                                    role='button' tabIndex={0}
                                    onClick={(): void => {setActiveEvent(val);}}>
                                    <span className={'lt-icons lt-list-item__icon'}
                                        aria-hidden='true'>
                                        <FontAwesomeIcon icon={faMapMarker}/>
                                    </span>
                                    <span className={'lt-list-item__primary-text'}>
                                        {val.label}
                                    </span>
                                </div>
                                {activeEvent && activeEvent.pk === val.pk && (
                                    <button
                                        type="button"
                                        onClick={(): void => {
                                            setActiveEventDetail(val);}}
                                        className={'lt-button btn-sm trailing'}>
                                        <span className='lt-button__text'>More</span>
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) }
        </div>
    );
};

