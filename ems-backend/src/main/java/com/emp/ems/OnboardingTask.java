package com.emp.ems;
import jakarta.persistence.*;import java.util.UUID;
@Entity @Table(name="onboarding_tasks",indexes=@Index(name="idx_task_employee",columnList="employee_id"))
public class OnboardingTask {
 @Id UUID id=UUID.randomUUID();@ManyToOne(fetch=FetchType.LAZY,optional=false)@JoinColumn(name="employee_id",nullable=false)Employee employee;@Column(nullable=false,length=150)String label;@Column(nullable=false)boolean done=false;@Column(nullable=false)int sortOrder;
 protected OnboardingTask(){}record View(UUID id,String label,boolean done){}View view(){return new View(id,label,done);}
}
