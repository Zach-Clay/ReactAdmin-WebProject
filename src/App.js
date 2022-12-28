import { 
  Admin,
  Resource,
  fetchUtils,
} from 'react-admin';
import MyRestClient from './MyRestClient';
import {
  StudentsList,
  StudentsShow,
  StudentsEdit,
  StudentsCreate
} from './Students';
import {
  GradesList,
  GradesShow,
  GradesEdit,
  GradesCreate
} from './Grades';

const httpClient = (url, options = {}) => {
  if (!options.headers) {
      options.headers = new Headers({ Accept: 'application/json' });
  }
  // add your own headers here
  options.headers.set('Authorization', 'Basic dGVhY2hlcjp0ZXN0aW5n');
  return fetchUtils.fetchJson(url, options);
};
const dataProvider = MyRestClient('../project5', httpClient);

const App = () => (
  <Admin dataProvider={dataProvider}>
    <Resource name="students" 
      list={StudentsList} 
      show={StudentsShow}
      edit={StudentsEdit}
      create={StudentsCreate}
    />
    <Resource name="grades" 
      list={GradesList}
      show={GradesShow}
      edit={GradesEdit}
      create={GradesCreate}
    />
  </Admin>
);

export default App;