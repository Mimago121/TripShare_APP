import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<< HEAD
import { UserListComponent } from './user-list';

describe('UserList', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
=======
import { UserList } from './user-list';

describe('UserList', () => {
  let component: UserList;
  let fixture: ComponentFixture<UserList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserList);
>>>>>>> 069e952051ceaebb8c98427c840201b10dc1437c
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
