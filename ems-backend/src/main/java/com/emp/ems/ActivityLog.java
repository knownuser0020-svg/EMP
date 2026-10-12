package com.emp.ems;
import jakarta.persistence.*;import java.time.*;import java.util.UUID;
@Entity @Table(name="activity_logs",indexes={@Index(name="idx_activity_employee_log_date",columnList="employee_id,log_date"),@Index(name="idx_activity_log_date",columnList="log_date")},uniqueConstraints=@UniqueConstraint(name="uk_activity_batch",columnNames={"employee_id","batch_id"}))
public class ActivityLog {
 @Id UUID id=UUID.randomUUID();@Column(nullable=false)UUID batchId;@ManyToOne(fetch=FetchType.LAZY,optional=false)@JoinColumn(name="employee_id",nullable=false)Employee employee;@Column(nullable=false)LocalDate logDate;@Column(nullable=false)Instant startedAt;@Column(nullable=false)Instant endedAt;@Column(nullable=false)int keyboardEvents;@Column(nullable=false)int mouseEvents;@Column(nullable=false)int idleSeconds;@Column(length=1024)String screenshotUrl;
 protected ActivityLog(){}record View(UUID id,UUID employeeId,LocalDate logDate,Instant startedAt,Instant endedAt,int keyboardEvents,int mouseEvents,int idleSeconds,String screenshotUrl){}
 View view(){return new View(id,employee.id,logDate,startedAt,endedAt,keyboardEvents,mouseEvents,idleSeconds,screenshotUrl);}
}
