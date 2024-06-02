import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

type Props = Omit<React.ComponentProps<typeof FontAwesomeIcon>, 'icon'>;

const Spinner: React.FC<Props> = ({ className, ...props }) => {
  return (
    <FontAwesomeIcon
      {...props}
      icon={faSpinner}
      className={classNames('animate-spin', className)}
    />
  );
};

export { Spinner };
