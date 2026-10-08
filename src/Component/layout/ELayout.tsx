import { UrlPrefix } from '../../Config/constValue';
import { routeTrees } from '../../Config/router/routeTrees';
import RouteSwitch from '../../Config/router/RouteSwitch';
import DeprecatedJavaExam from '../../Pages/Exam/DeprecatedJavaExam';

export default function ELayout() {
  return (
    <RouteSwitch
      routes={[
        { id: 1, path: UrlPrefix + '/exam', exact: true, component: DeprecatedJavaExam },
        ...routeTrees.exam,
      ]}
    />
  );
}
