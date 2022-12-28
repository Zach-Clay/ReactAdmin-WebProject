import { 
  List, 
  Datagrid, 
  TextField,
  Create,
  SimpleShowLayout,
  SimpleForm,
  Edit,
  TextInput,
  Show,
  ReferenceManyField,
  NumberField
} from "react-admin";

export const StudentsList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
    </Datagrid>
  </List>
);

export const StudentsShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <ReferenceManyField label="Grades" reference="grades" target="student_id">
        <Datagrid>
          <TextField source="type" />
          <NumberField source="grade" />
          <NumberField source="max" />
        </Datagrid>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);

export const StudentsEdit = () => (
  <Edit>
    <SimpleForm>
      <TextField source="id" />
      <TextInput source="name" />
    </SimpleForm>
  </Edit>
);

export const StudentsCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="id" />
      <TextInput source="name" />
    </SimpleForm>
  </Create>
);