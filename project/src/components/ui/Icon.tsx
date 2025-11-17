import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPen,
  faEye,
  faArrowLeft,
  faUpload,
  faMapMarkerAlt,
  faCalendar,
  faUser,
  faCar,
  faFileAlt,
  faClock,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faSearch,
  faFilter,
  faBell,
  faBars,
  faDownload,
  faChartLine,
  faWallet,
  faMoneyBillWave,
  faUserShield,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner,
  faBuilding,
  faTrash,
  faCopy
} from '@fortawesome/free-solid-svg-icons';

// Mapping from semantic name to actual icon definition
const iconMap = {
  plus: faPlus,
  edit: faPen,
  eye: faEye,
  back: faArrowLeft,
  upload: faUpload,
  location: faMapMarkerAlt,
  calendar: faCalendar,
  user: faUser,
  car: faCar,
  file: faFileAlt,
  clock: faClock,
  close: faTimes,
  chevronLeft: faChevronLeft,
  chevronRight: faChevronRight,
  chevronUp: faChevronUp,
  chevronDown: faChevronDown,
  search: faSearch,
  filter: faFilter,
  bell: faBell,
  menu: faBars,
  download: faDownload,
  chart: faChartLine,
  wallet: faWallet,
  money: faMoneyBillWave,
  role: faUserShield,
  success: faCheckCircle,
  warning: faExclamationTriangle,
  spinner: faSpinner,
  building: faBuilding,
  delete: faTrash,
  copy: faCopy
};

export type IconName = keyof typeof iconMap;

interface IconProps { name: IconName; className?: string; spin?: boolean }

export const Icon: React.FC<IconProps> = ({ name, className, spin }) => {
  const icon = iconMap[name];
  if (!icon) return null;
  return <FontAwesomeIcon icon={icon} className={className} spin={spin} />;
};
