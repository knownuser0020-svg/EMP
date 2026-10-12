package com.emp.ems;
import jakarta.persistence.*;import java.util.UUID;
@Entity @Table(name="employees",indexes={@Index(name="idx_employee_email",columnList="email",unique=true),@Index(name="idx_employee_department",columnList="department")})
public class Employee {
 @Id UUID id=UUID.randomUUID();@Column(nullable=false,length=100)String name;@Column(nullable=false,unique=true,length=254)String email;@Column(nullable=false)String passwordHash;@Column(nullable=false,length=100)String title;@Column(nullable=false,length=60)String department;@Column(nullable=false,length=20)String role="EMPLOYEE";@Column(nullable=false,length=20)String status="Onboarding";@Column(nullable=false)int avatar=1;@Column(nullable=false)long authVersion=0;
 protected Employee(){}
 public record View(UUID id,String name,String email,String title,String department,int avatar,String status){}
 View view(){return new View(id,name,email,title,department,avatar,status);}
}
